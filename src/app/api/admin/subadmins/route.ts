import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET() {
  try {
    const subAdmins = await InventoryStore.listSubAdmins();
    return NextResponse.json({ success: true, subAdmins });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.email || !body.password || !body.shopName || !body.name) {
      return NextResponse.json({ error: 'Name, email, password and shop name are required' }, { status: 400 });
    }

    const subAdmin = await InventoryStore.createSubAdmin({
      name: body.name,
      email: body.email,
      password: body.password,
      shopName: body.shopName,
      subscriptionType: body.subscriptionType || 'days',
      days: Number(body.days) || 10,
    });

    return NextResponse.json({ success: true, subAdmin });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { teamId, subscriptionType, addDays, setDays, isAccessRevoked } = await req.json();
    if (!teamId) return NextResponse.json({ error: 'Team ID required' }, { status: 400 });

    const ok = await InventoryStore.updateSubAdminSubscription(teamId, {
      subscriptionType,
      addDays,
      setDays,
      isAccessRevoked,
    });

    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
