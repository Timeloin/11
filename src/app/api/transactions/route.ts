import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';
  const transactions = await InventoryStore.getTransactions(teamId);
  return NextResponse.json({ success: true, transactions });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const teamId = body.teamId || 'team_1';
    
    if (!body.type || !body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'Invalid transaction parameters' }, { status: 400 });
    }

    const txn = await InventoryStore.recordTransaction({
      teamId,
      type: body.type,
      fromLocationId: body.fromLocationId,
      fromLocationName: body.fromLocationName,
      toLocationId: body.toLocationId,
      toLocationName: body.toLocationName,
      items: body.items,
      totalQuantity: body.totalQuantity || body.items.reduce((acc: number, it: any) => acc + it.quantity, 0),
      reason: body.reason,
      contactName: body.contactName,
      invoiceNo: body.invoiceNo,
      userId: body.userId || 'user_1',
      userName: body.userName || 'Admin User',
    });

    return NextResponse.json({ success: true, transaction: txn });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
