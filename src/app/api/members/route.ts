import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';
  const members = await InventoryStore.getMembers(teamId);
  return NextResponse.json({ success: true, members });
}

export async function POST(req: Request) {
  const body = await req.json();
  const teamId = body.teamId || 'team_1';
  if (!body.name || !body.email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });

  const member = await InventoryStore.inviteMember(teamId, body.name, body.email, body.role || 'sales', body.customPermissions);
  return NextResponse.json({ success: true, member });
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.memberId || !body.role) return NextResponse.json({ error: 'Member ID and role required' }, { status: 400 });
  const updated = await InventoryStore.updateMemberRole(body.memberId, body.role, body.customPermissions);
  return NextResponse.json({ success: true, member: updated });
}
