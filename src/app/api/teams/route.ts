import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET() {
  const teams = await InventoryStore.listTeams();
  return NextResponse.json({ success: true, teams });
}

export async function POST(req: Request) {
  try {
    const { name, currency } = await req.json();
    if (!name) return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    const team = await InventoryStore.createTeam(name, 'user_1', currency || '₹');
    return NextResponse.json({ success: true, team });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
