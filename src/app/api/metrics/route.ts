import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId') || 'team_1';
  const metrics = await InventoryStore.getDashboardMetrics(teamId);
  const categories = await InventoryStore.getCategories();
  const brands = await InventoryStore.getBrands();
  return NextResponse.json({ success: true, metrics, categories, brands });
}
