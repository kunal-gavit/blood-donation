import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import sheets from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const logs = await sheets.getAllAuditLogs();
    return NextResponse.json({ success: true, logs });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
