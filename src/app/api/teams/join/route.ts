import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { inviteCode, userName, email } = await req.json();
    if (!inviteCode) return NextResponse.json({ error: 'Invite code required' }, { status: 400 });
    const team = await InventoryStore.joinTeamByCode(inviteCode, 'user_' + Date.now(), userName || 'Team Member', email || 'member@shop.com');
    if (!team) return NextResponse.json({ error: 'Invalid invite code or team not found' }, { status: 404 });
    return NextResponse.json({ success: true, team });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
