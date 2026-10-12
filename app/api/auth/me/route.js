import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import sheets from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ authenticated: false, error: auth.error }, { status: 401 });
  }

  // Active status check against Google Sheets Admins sheet
  try {
    const admins = await sheets.getAllAdmins();
    const adminRecord = admins.find((a) => a.adminId === auth.user.adminId || a.email.toLowerCase() === auth.user.email.toLowerCase());
    if (adminRecord && adminRecord.activeStatus !== 'active') {
      return NextResponse.json(
        { authenticated: false, error: 'Your administrator access has been revoked.' },
        { status: 403 }
      );
    }
  } catch (err) {
    // If sheets check fails, keep session active
  }

  return NextResponse.json({
    authenticated: true,
    user: auth.user,
  });
}
