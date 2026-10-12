import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { updateDonorRecord, deleteDonorRecord } from '@/lib/donors-service';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Donor ID is required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updated = await updateDonorRecord(id, body, auth.user);
    return NextResponse.json({ success: true, donor: updated });
  } catch (err) {
    console.error('Error updating donor:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update donor record.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Donor ID is required.' }, { status: 400 });
  }

  try {
    const result = await deleteDonorRecord(id, auth.user);
    return NextResponse.json({ success: true, message: `Donor ${id} deleted successfully.`, ...result });
  } catch (err) {
    console.error('Error deleting donor:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete donor record.' },
      { status: 400 }
    );
  }
}
