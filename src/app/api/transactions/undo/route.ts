import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, operatorName, userId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const result = await InventoryStore.undoTransaction(
      transactionId,
      operatorName || 'Main Admin',
      userId || 'user_admin'
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('API Undo Transaction error:', err);
    return NextResponse.json({ error: err.message || 'Failed to undo transaction' }, { status: 400 });
  }
}
