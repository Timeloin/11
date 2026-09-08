import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const teamId = searchParams.get('teamId') || 'team_1';

  if (!code) return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
  const item = await InventoryStore.findItemByBarcode(teamId, code);
  return NextResponse.json({ success: true, found: !!item, item });
}
