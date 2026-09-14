import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';
  const members = await InventoryStore.getMembers(teamId);
  return NextResponse.json({ success: true, members });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const teamId = body.teamId || 'team_1';
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ error: 'Name, email and password are required for new staff members' }, { status: 400 });
    }

    const member = await InventoryStore.addMemberWithCredentials(teamId, {
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || 'sales',
      customPermissions: body.customPermissions,
    });

    return NextResponse.json({ success: true, member });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
