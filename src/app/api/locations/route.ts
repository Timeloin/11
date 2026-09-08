import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';
  const locations = await InventoryStore.getLocations(teamId);
  return NextResponse.json({ success: true, locations });
}

export async function POST(req: Request) {
  const body = await req.json();
  const teamId = body.teamId || 'team_1';
  if (!body.name) return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
  const loc = await InventoryStore.addLocation(teamId, body.name);
  return NextResponse.json({ success: true, location: loc });
}
