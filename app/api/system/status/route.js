import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { checkConnection } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const status = await checkConnection();
    return NextResponse.json({ success: true, status });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
