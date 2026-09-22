import { NextResponse } from 'next/server';
import { InventoryStore } from '@/lib/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId') || 'team_1';
    const email = searchParams.get('email')?.toLowerCase().trim();

    let sessionRevoked = false;
    let currentMember = null;

    if (email) {
      const isEnvAdmin = InventoryStore.isMainAdmin(email);
      if (!isEnvAdmin) {
        currentMember = await InventoryStore.findMemberByEmail(email);
        if (!currentMember) {
          sessionRevoked = true;
        }
      }
    }

    const [teams, metrics, categories, brands, items, locations, transactions, members] = await Promise.all([
      InventoryStore.listTeams(),
      InventoryStore.getDashboardMetrics(teamId),
      InventoryStore.getCategories(),
      InventoryStore.getBrands(),
      InventoryStore.getItems(teamId),
      InventoryStore.getLocations(teamId),
      InventoryStore.getTransactions(teamId, 50),
      InventoryStore.getMembers(teamId),
    ]);

    return NextResponse.json({
      success: true,
      sessionRevoked,
      currentMember,
      teams,
      metrics,
      categories,
      brands,
      items,
      locations,
      transactions,
      members,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
