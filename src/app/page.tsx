'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MetricBanner } from '@/components/MetricBanner';
import { BottomNav, TabType } from '@/components/BottomNav';
import { HomeScreen } from '@/components/HomeScreen';
import { ItemsScreen } from '@/components/ItemsScreen';
import { TransactionsScreen } from '@/components/TransactionsScreen';
import { SettingsScreen } from '@/components/SettingsScreen';
import { NewItemModal } from '@/components/modals/NewItemModal';
import { BarcodeScannerModal } from '@/components/modals/BarcodeScannerModal';
import { StockActionModal } from '@/components/modals/StockActionModal';
import { NewTeamModal } from '@/components/modals/NewTeamModal';
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import { ItemDetailModal } from '@/components/modals/ItemDetailModal';
import { IItem, ILocation, IStockTransaction, ITeam, ITeamMember, TransactionType } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [currentTeam, setCurrentTeam] = useState<ITeam | null>(null);
  const [items, setItems] = useState<IItem[]>([]);
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [transactions, setTransactions] = useState<IStockTransaction[]>([]);
  const [members, setMembers] = useState<ITeamMember[]>([]);
  const [categories, setCategories] = useState<string[]>(['mobile phone', 'accessories']);
  const [brands, setBrands] = useState<string[]>(['vivo', 'samsung', 'generic']);
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    totalInventoryValue: 0,
    stockInToday: 0,
    stockOutToday: 0,
    lowStockCount: 0,
    todayDateStr: 'Sep 8',
  });

  // Modals state
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [stockModalConfig, setStockModalConfig] = useState<{
    isOpen: boolean;
    type: TransactionType;
    preselectedItem: IItem | null;
  }>({
    isOpen: false,
    type: 'stock_in',
    preselectedItem: null,
  });
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<IItem | null>(null);
  const [scannedBarcodeForNewItem, setScannedBarcodeForNewItem] = useState<string | undefined>();

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      const teamsRes = await fetch('/api/teams').then((r) => r.json());
      let activeTeam = currentTeam;

      if (teamsRes.success && teamsRes.teams?.length > 0) {
        setTeams(teamsRes.teams);
        if (!activeTeam) {
          activeTeam = teamsRes.teams[0];
          setCurrentTeam(teamsRes.teams[0]);
        }
      }

      const activeTeamId = activeTeam?._id || 'team_1';
      const [metricsRes, itemsRes, locsRes, txnsRes, memRes] = await Promise.all([
        fetch('/api/metrics?teamId=' + activeTeamId).then((r) => r.json()),
        fetch('/api/items?teamId=' + activeTeamId).then((r) => r.json()),
        fetch('/api/locations?teamId=' + activeTeamId).then((r) => r.json()),
        fetch('/api/transactions?teamId=' + activeTeamId).then((r) => r.json()),
        fetch('/api/members?teamId=' + activeTeamId).then((r) => r.json()),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.metrics);
        if (metricsRes.categories) setCategories(metricsRes.categories);
        if (metricsRes.brands) setBrands(metricsRes.brands);
      }
      if (itemsRes.success) setItems(itemsRes.items);
      if (locsRes.success) setLocations(locsRes.locations);
      if (txnsRes.success) setTransactions(txnsRes.transactions);
      if (memRes.success) setMembers(memRes.members);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, [currentTeam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSaveItem = async (itemData: any) => {
    await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...itemData, teamId: currentTeam?._id || 'team_1' }),
    });
    await loadData();
  };

  const handleExecuteTransaction = async (txnData: any) => {
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txnData, teamId: currentTeam?._id || 'team_1' }),
    });
    await loadData();
  };

  const handleCreateTeam = async (name: string) => {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      setCurrentTeam(data.team);
      await loadData();
    }
  };

  const handleJoinTeam = async (inviteCode: string) => {
    const res = await fetch('/api/teams/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode }),
    });
    const data = await res.json();
    if (data.success) {
      setCurrentTeam(data.team);
      await loadData();
    } else {
      throw new Error(data.error || 'Failed to join team');
    }
  };

  const handleInviteMember = async (memberData: any) => {
    await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...memberData, teamId: currentTeam?._id || 'team_1' }),
    });
    await loadData();
  };

  const handleAddLocation = async (name: string) => {
    await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, teamId: currentTeam?._id || 'team_1' }),
    });
    await loadData();
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Total Stock', 'Unit'];
    const rows = items.map((i) => [
      i.sku,
      '"' + i.name + '"',
      i.category,
      i.brand,
      i.costPrice,
      i.sellingPrice,
      i.totalStock,
      i.unit,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'inventory_' + (currentTeam?.name.replace(/\s+/g, '_') || 'export') + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stock action triggers
  const openStockModal = (type: TransactionType, item: IItem | null = null) => {
    setStockModalConfig({
      isOpen: true,
      type,
      preselectedItem: item,
    });
  };

  // Reactive metric calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const liveStockInToday = transactions
    .filter((t) => (t.type === 'stock_in' || t.type === 'purchase') && t.createdAt && new Date(t.createdAt).toISOString().startsWith(todayStr))
    .reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

  const liveStockOutToday = transactions
    .filter((t) => (t.type === 'stock_out' || t.type === 'sale') && t.createdAt && new Date(t.createdAt).toISOString().startsWith(todayStr))
    .reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white pb-10">
      {/* Mobile Frame Container */}
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Header */}
        <Header
          currentTeam={currentTeam}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
        />

        {/* Home Metric Banner (only on Home tab) */}
        {activeTab === 'home' && (
          <MetricBanner
            dateStr={metrics.todayDateStr}
            totalItems={items.length}
            stockInToday={liveStockInToday}
            stockOutToday={liveStockOutToday}
            currency={currentTeam?.currency}
          />
        )}

        {/* View Screens */}
        <main className="flex-1 bg-[#f3f4f8]">
          {activeTab === 'home' && (
            <HomeScreen
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                if (q.trim()) setActiveTab('items');
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenNewItem={() => {
                setScannedBarcodeForNewItem(undefined);
                setIsNewItemOpen(true);
              }}
              onOpenStockIn={() => openStockModal('stock_in')}
              onOpenStockOut={() => openStockModal('stock_out')}
              onOpenMoveStock={() => openStockModal('move')}
              onOpenAdjustStock={() => openStockModal('adjust')}
              onOpenShortages={() => {
                setActiveTab('items');
                setSearchQuery('');
              }}
              onOpenInventoryCount={() => openStockModal('adjust')}
              onOpenInviteMembers={() => setIsInviteOpen(true)}
              onOpenPastQuantity={() => setActiveTab('transactions')}
              onOpenBarcodeLabels={() => alert('Barcode Label Generator: Ready for thermal printer export!')}
              onOpenPurchases={() => openStockModal('stock_in')}
              onOpenSales={() => openStockModal('stock_out')}
            />
          )}

          {activeTab === 'items' && (
            <ItemsScreen
              items={items}
              categories={categories}
              brands={brands}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNewItem={() => {
                setScannedBarcodeForNewItem(undefined);
                setIsNewItemOpen(true);
              }}
              onSelectItem={(item) => setSelectedItemForDetail(item)}
              onStockInItem={(item) => openStockModal('stock_in', item)}
              onStockOutItem={(item) => openStockModal('stock_out', item)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsScreen transactions={transactions} onExport={handleExportCSV} />
          )}

          {activeTab === 'settings' && (
            <SettingsScreen
              team={currentTeam}
              members={members}
              locations={locations}
              onOpenInvite={() => setIsInviteOpen(true)}
              onAddLocation={handleAddLocation}
              onExportData={handleExportCSV}
            />
          )}
        </main>

        {/* Persistent Bottom Navigation */}
        <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Modals */}
        <ItemDetailModal
          isOpen={!!selectedItemForDetail}
          item={selectedItemForDetail}
          locations={locations}
          onClose={() => setSelectedItemForDetail(null)}
          onStockIn={(item) => openStockModal('stock_in', item)}
          onStockOut={(item) => openStockModal('stock_out', item)}
          onMoveStock={(item) => openStockModal('move', item)}
          onAdjustStock={(item) => openStockModal('adjust', item)}
        />

        <NewItemModal
          isOpen={isNewItemOpen}
          onClose={() => setIsNewItemOpen(false)}
          locations={locations}
          categories={categories}
          brands={brands}
          initialBarcode={scannedBarcodeForNewItem}
          onSave={handleSaveItem}
        />

        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          teamId={currentTeam?._id || 'team_1'}
          onFoundItem={(item, action) => {
            if (action === 'stock_in') openStockModal('stock_in', item);
            else if (action === 'stock_out') openStockModal('stock_out', item);
            else {
              setSearchQuery(item.name);
              setActiveTab('items');
            }
          }}
          onCreateWithBarcode={(code) => {
            setScannedBarcodeForNewItem(code);
            setIsNewItemOpen(true);
          }}
        />

        <StockActionModal
          isOpen={stockModalConfig.isOpen}
          onClose={() => setStockModalConfig({ ...stockModalConfig, isOpen: false })}
          type={stockModalConfig.type}
          items={items}
          locations={locations}
          preselectedItem={stockModalConfig.preselectedItem}
          onExecute={handleExecuteTransaction}
        />

        <NewTeamModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          teams={teams}
          currentTeam={currentTeam}
          onSelectTeam={(t) => setCurrentTeam(t)}
          onCreateTeam={handleCreateTeam}
          onJoinTeam={handleJoinTeam}
        />

        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInvite={handleInviteMember}
        />
      </div>
    </div>
  );
}
