import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getAdminList, updateSecondAdmin } from '@/lib/admins-service';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
  }

  try {
    const admins = await getAdminList();
    const safeAdmins = admins.map((a) => ({
      adminId: a.adminId,
      name: a.name,
      email: a.email,
      role: a.role,
      activeStatus: a.activeStatus,
      createdAt: a.createdAt,
    }));
    return NextResponse.json({ success: true, admins: safeAdmins, isOwner: auth.user.role === 'owner' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  if (auth.user.role !== 'owner') {
    return NextResponse.json(
      { error: 'Forbidden: Only the Owner administrator can invite or manage administrator accounts.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const updated = await updateSecondAdmin(body, auth.user);
    return NextResponse.json({ success: true, admin: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
