import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import sheets from '@/lib/google-sheets';
import {
  registerDonor,
  calculateSummaryStats,
  normalizePRN,
} from '@/lib/donors-service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const allDonors = await sheets.getAllDonors();
    const summary = calculateSummaryStats(allDonors);

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const year = searchParams.get('year') || '';
    const division = searchParams.get('division') || '';
    const department = searchParams.get('department') || '';
    const bloodGroup = searchParams.get('bloodGroup') || '';
    const status = searchParams.get('status') || '';

    let filtered = [...allDonors];

    if (search) {
      filtered = filtered.filter((d) => {
        const idMatch = d.donorId?.toLowerCase().includes(search);
        const nameMatch = d.fullName?.toLowerCase().includes(search);
        const prnMatch = d.prn?.toLowerCase().includes(search);
        return idMatch || nameMatch || prnMatch;
      });
    }

    if (year) {
      filtered = filtered.filter((d) => d.year === year);
    }

    if (division) {
      filtered = filtered.filter((d) => d.division === division);
    }

    if (department) {
      filtered = filtered.filter((d) => d.department === department);
    }

    if (bloodGroup) {
      filtered = filtered.filter((d) => d.bloodGroup === bloodGroup);
    }

    if (status) {
      filtered = filtered.filter((d) => d.verificationStatus === status);
    }

    // Sort by registration date descending
    filtered.sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0));

    return NextResponse.json({
      success: true,
      donors: filtered,
      summary,
      totalCount: allDonors.length,
      filteredCount: filtered.length,
    });
  } catch (err) {
    console.error('Error fetching donors:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve donors from Google Sheets.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Only authenticated admins can register donors.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const newDonor = await registerDonor(body, auth.user);
    return NextResponse.json({ success: true, donor: newDonor }, { status: 201 });
  } catch (err) {
    console.error('Error creating donor:', err);
    if (err.code === 'DUPLICATE_PRN') {
      return NextResponse.json(
        { error: err.message, code: 'DUPLICATE_PRN', existingDonorId: err.existingDonorId },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Failed to add donor to Google Sheets.' },
      { status: 400 }
    );
  }
}
