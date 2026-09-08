import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';

  const item = await InventoryStore.getItemById(teamId, id);
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ success: true, item });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const teamId = body.teamId || 'team_1';

  const item = await InventoryStore.updateItem(teamId, id, body);
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ success: true, item });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';

  const ok = await InventoryStore.deleteItem(teamId, id);
  return NextResponse.json({ success: ok });
}
