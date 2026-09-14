import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const authResult = await InventoryStore.authenticateUser(email, password);

    if (authResult.accessDenied) {
      return NextResponse.json({
        success: false,
        accessDenied: true,
        reason: authResult.accessReason,
        session: authResult.session,
      }, { status: 403 });
    }

    if (!authResult.success || !authResult.session) {
      return NextResponse.json({ error: authResult.error || 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken(authResult.session);
    return NextResponse.json({
      success: true,
      token,
      session: authResult.session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
