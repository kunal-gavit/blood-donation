import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import sheets from '@/lib/google-sheets';
import {
  generateXlsxBuffer,
  generateCsvString,
  getSafeExportFilename,
} from '@/lib/export-utils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required to export records.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const year = searchParams.get('year') || '';
    const division = searchParams.get('division') || '';
    const department = searchParams.get('department') || '';
    const bloodGroup = searchParams.get('bloodGroup') || '';
    const status = searchParams.get('status') || '';

    // Fetch trusted records from Google Sheets
    const allDonors = await sheets.getAllDonors();

    // Apply exact server-side filtering
    let donorsToExport = allDonors.filter((d) => {
      if (search) {
        const idMatch = d.donorId?.toLowerCase().includes(search);
        const nameMatch = d.fullName?.toLowerCase().includes(search);
        const prnMatch = d.prn?.toLowerCase().includes(search);
        if (!idMatch && !nameMatch && !prnMatch) return false;
      }
      if (year && d.year !== year) return false;
      if (division && d.division !== division) return false;
      if (department && d.department !== department) return false;
      if (bloodGroup && d.bloodGroup !== bloodGroup) return false;
      if (status && d.verificationStatus !== status) return false;
      return true;
    });

    if (format === 'csv') {
      const csvData = generateCsvString(donorsToExport);
      const filename = getSafeExportFilename('Blood_Donors_Export', 'csv');

      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Default: Genuine XLSX
    const xlsxBuffer = generateXlsxBuffer(donorsToExport, 'Donors');
    const filename = getSafeExportFilename('Blood_Donors_Export', 'xlsx');

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate export file.' },
      { status: 500 }
    );
  }
}
