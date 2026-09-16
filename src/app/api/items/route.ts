import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';
import { verifyAdminPassword } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;
  const brand = searchParams.get('brand') || undefined;
  const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

  const items = await InventoryStore.getItems(teamId, { search, category, brand, lowStockOnly });
  return NextResponse.json({ success: true, items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const teamId = body.teamId || 'team_1';
    if (!body.name) return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    
    // Auto register category/brand if new
    if (body.category) await InventoryStore.addCategory(body.category);
    if (body.brand) await InventoryStore.addBrand(body.brand);

    const item = await InventoryStore.createItem(teamId, body);
    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId') || 'team_1';
    const adminPassword = req.headers.get('x-admin-password') || searchParams.get('adminPassword') || '';

    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json(
        { error: 'Incorrect Admin Password. Only Admin can delete items.' },
        { status: 403 }
      );
    }

    const ok = await InventoryStore.deleteAllItems(teamId);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
