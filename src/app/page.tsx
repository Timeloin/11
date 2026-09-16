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
import { InviteMemberModal } from '@/components/modals/InviteMemberModal';
import { ItemDetailModal } from '@/components/modals/ItemDetailModal';
import { ShortagesModal } from '@/components/modals/ShortagesModal';
import { CsvImportModal } from '@/components/modals/CsvImportModal';
import { LoginScreen } from '@/components/LoginScreen';
import { IItem, ILocation, IStockTransaction, ITeam, ITeamMember, TransactionType, UserSession } from '@/types';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App Tabs & Navigation
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
    todayDateStr: 'Sep 16',
  });

  // Modals state
  const [isNewItemOpen, setIsNewItemOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [shortagesModalConfig, setShortagesModalConfig] = useState<{
    isOpen: boolean;
    mode: 'current' | 'by_date';
  }>({
    isOpen: false,
    mode: 'current',
  });
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

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inventory_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSession(parsed);
      }
    } catch (e) {}
    setIsAuthChecking(false);
  }, []);

  const handleLoginSuccess = (userSession: UserSession, token: string) => {
    setSession(userSession);
    try {
      localStorage.setItem('inventory_session', JSON.stringify(userSession));
      localStorage.setItem('inventory_token', token);
    } catch (e) {}
  };

  const handleLogout = () => {
    setSession(null);
    try {
      localStorage.removeItem('inventory_session');
      localStorage.removeItem('inventory_token');
    } catch (e) {}
  };

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  // Fetch shop inventory data
  const loadData = useCallback(async () => {
    if (!session) return;
    try {
      const targetTeamId = currentTeam?._id || session.activeTeamId || 'team_1';
      const syncRes = await fetch('/api/sync?teamId=' + targetTeamId).then((r) => r.json());

      if (syncRes.success) {
        if (syncRes.teams?.length > 0) {
          setTeams(syncRes.teams);
          const matched = syncRes.teams.find((t: ITeam) => t._id === targetTeamId) || syncRes.teams[0];
          setCurrentTeam(matched);
        }
        if (syncRes.metrics) setMetrics(syncRes.metrics);
        if (syncRes.categories) setCategories(syncRes.categories);
        if (syncRes.brands) setBrands(syncRes.brands);
        if (syncRes.items) setItems(syncRes.items);
        if (syncRes.locations) setLocations(syncRes.locations);
        if (syncRes.transactions) setTransactions(syncRes.transactions);
        if (syncRes.members) setMembers(syncRes.members);
      }
    } catch (e) {
      console.error('Error syncing shop data:', e);
    }
  }, [session, currentTeam]);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, loadData]);

  // Handlers with instant optimistic updates
  const handleSaveItem = async (itemData: any) => {
    const activeTeamId = currentTeam?._id || session?.activeTeamId || 'team_1';
    const tempId = 'temp_' + Date.now();
    const parsedStock = Number(itemData.totalStock) || 0;
    const parsedCost = Number(itemData.costPrice) || 0;

    const optimisticItem: IItem = {
      _id: tempId,
      teamId: activeTeamId,
      sku: itemData.sku || 'SKU-' + Date.now().toString().slice(-6),
      name: itemData.name || 'New Item',
      description: itemData.description || '',
      category: itemData.category || 'General',
      brand: itemData.brand || 'Generic',
      unit: itemData.unit || 'pcs',
      costPrice: parsedCost,
      sellingPrice: Number(itemData.sellingPrice) || 0,
      minStock: Number(itemData.minStock) || 5,
      barcodes: itemData.barcodes || [],
      images: [],
      stockByLocation: itemData.stockByLocation || [],
      totalStock: parsedStock,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => [optimisticItem, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      totalItems: prev.totalItems + 1,
      stockInToday: prev.stockInToday + parsedStock,
      totalInventoryValue: prev.totalInventoryValue + parsedStock * parsedCost,
    }));
    if (itemData.category && !categories.includes(itemData.category.toLowerCase())) {
      setCategories((prev) => [...prev, itemData.category.toLowerCase()]);
    }
    if (itemData.brand && !brands.includes(itemData.brand.toLowerCase())) {
      setBrands((prev) => [...prev, itemData.brand.toLowerCase()]);
    }

    showToast('⚡ Item created instantly!');

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemData, teamId: activeTeamId }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((i) => (i._id === tempId ? data.item : i)));
      }
    } catch (err) {
      console.error('Background save error:', err);
    }
  };

  const handleDeleteItem = async (item: IItem) => {
    const activeTeamId = currentTeam?._id || session?.activeTeamId || 'team_1';
    
    // Optimistically remove from state
    setItems((prev) => prev.filter((i) => i._id !== item._id));
    setMetrics((prev) => ({
      ...prev,
      totalItems: Math.max(0, prev.totalItems - 1),
      totalInventoryValue: Math.max(0, prev.totalInventoryValue - (Number(item.totalStock || 0) * Number(item.costPrice || 0))),
    }));
    setSelectedItemForDetail(null);
    showToast(`🗑️ "${item.name}" deleted!`);

    try {
      await fetch(`/api/items/${item._id}?teamId=${activeTeamId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Delete item error:', err);
    }
  };

  const handleUpdateItem = async (itemId: string, updatedData: Partial<IItem>) => {
    const activeTeamId = currentTeam?._id || session?.activeTeamId || 'team_1';

    // Optimistically update items list and selected item detail
    setItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, ...updatedData, updatedAt: new Date().toISOString() } : i))
    );
    setSelectedItemForDetail((prev) =>
      prev && prev._id === itemId ? { ...prev, ...updatedData, updatedAt: new Date().toISOString() } : prev
    );

    if (updatedData.category && !categories.includes(updatedData.category.toLowerCase())) {
      setCategories((prev) => [...prev, updatedData.category!.toLowerCase()]);
    }
    if (updatedData.brand && !brands.includes(updatedData.brand.toLowerCase())) {
      setBrands((prev) => [...prev, updatedData.brand!.toLowerCase()]);
    }

    showToast('✏️ Item updated successfully!');

    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, teamId: activeTeamId }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setItems((prev) => prev.map((i) => (i._id === itemId ? data.item : i)));
        setSelectedItemForDetail((prev) => (prev && prev._id === itemId ? data.item : prev));
      }
    } catch (err) {
      console.error('Update item error:', err);
    }
  };

  const handleUpdateProfileName = async (newName: string) => {
    if (!session) return;
    const updatedSession = { ...session, userName: newName, name: newName };
    setSession(updatedSession);
    try {
      localStorage.setItem('inventory_session', JSON.stringify(updatedSession));
    } catch (e) {}

    showToast('Name updated successfully!');

    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.userId, name: newName }),
      });
    } catch (e) {
      console.error('Error saving profile name:', e);
    }
  };

  const handleExecuteTransaction = async (data: any) => {
    const activeTeamId = currentTeam?._id || session?.activeTeamId || 'team_1';
    const operatorName = session?.userName || session?.name || 'Main Admin';
    const txnPayload = {
      ...data,
      teamId: activeTeamId,
      userId: session?.userId || 'user_admin',
      userName: operatorName,
    };

    const targetItem = items.find((i) => i._id === data.itemId);
    const qtyChange = Number(data.quantity) || 0;

    if (targetItem) {
      let newTotal = targetItem.totalStock;
      if (data.type === 'stock_in' || data.type === 'purchase') {
        newTotal += qtyChange;
      } else if (data.type === 'stock_out' || data.type === 'sale') {
        newTotal = Math.max(0, newTotal - qtyChange);
      } else if (data.type === 'adjust') {
        newTotal = qtyChange;
      }

      setItems((prev) =>
        prev.map((i) => (i._id === targetItem._id ? { ...i, totalStock: newTotal } : i))
      );
    }

    const optimisticTxn: IStockTransaction = {
      _id: 'temp_txn_' + Date.now(),
      teamId: activeTeamId,
      type: data.type,
      referenceNo: 'TXN-' + Date.now().toString().slice(-6),
      items: [
        {
          itemId: data.itemId,
          sku: targetItem?.sku || '',
          name: targetItem?.name || '',
          quantity: qtyChange,
          unitCost: targetItem?.costPrice,
        },
      ],
      totalQuantity: qtyChange,
      reason: data.reason || 'Manual Update',
      userId: session?.userId || 'user_admin',
      userName: operatorName,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [optimisticTxn, ...prev.slice(0, 399)]);
    showToast(`⚡ ${data.type === 'stock_in' ? 'Stock In' : 'Stock Out'} recorded!`);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txnPayload),
      });
      const resData = await res.json();
      if (resData.success && resData.transaction) {
        setTransactions((prev) =>
          prev.map((t) => (t._id === optimisticTxn._id ? resData.transaction : t))
        );
      }
    } catch (err) {
      console.error('Error recording transaction:', err);
    }
  };

  const handleAddLocation = async (name: string) => {
    const activeTeamId = currentTeam?._id || session?.activeTeamId || 'team_1';
    const optimisticLoc: ILocation = {
      _id: 'temp_loc_' + Date.now(),
      teamId: activeTeamId,
      name,
      isDefault: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    setLocations((prev) => [...prev, optimisticLoc]);
    showToast('Location added!');

    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: activeTeamId, name }),
      });
      const data = await res.json();
      if (data.success && data.location) {
        setLocations((prev) => prev.map((l) => (l._id === optimisticLoc._id ? data.location : l)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMember = async (memberData: any) => {
    const activeTeamId = currentTeam?._id || session?.activeTeamId || 'team_1';
    const optimisticMember: ITeamMember = {
      _id: 'temp_mem_' + Date.now(),
      teamId: activeTeamId,
      userId: 'user_' + Date.now(),
      name: memberData.name,
      email: memberData.email,
      role: memberData.role || 'sales',
      status: 'active',
      joinedAt: new Date().toISOString(),
    };

    setMembers((prev) => [...prev, optimisticMember]);
    showToast('Member added!');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...memberData, teamId: activeTeamId }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        setMembers((prev) => prev.map((m) => (m._id === optimisticMember._id ? data.member : m)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Brand', 'Cost Price', 'Selling Price', 'Total Stock', 'Safety Stock'];
    const rows = items.map((i) => [
      `"${(i.name || '').replace(/"/g, '""')}"`,
      `"${i.sku || ''}"`,
      `"${i.category || ''}"`,
      `"${i.brand || ''}"`,
      i.costPrice || 0,
      i.sellingPrice || 0,
      i.totalStock || 0,
      i.minStock || 5,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `simran_mobile_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Stock sheet exported to CSV!');
  };

  const openStockModal = (type: TransactionType, item?: IItem | null) => {
    setStockModalConfig({
      isOpen: true,
      type,
      preselectedItem: item || null,
    });
  };

  // 1. Initial auth loading state
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#f3f4f8] flex items-center justify-center text-xs text-gray-400">
        Loading Simran Mobile...
      </div>
    );
  }

  // 2. Not Logged In -> Show Login Screen
  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Main Shop Inventory App View
  const todayStr = new Date().toISOString().split('T')[0];
  const liveStockInToday = transactions
    .filter(
      (t) =>
        (t.type === 'stock_in' || t.type === 'purchase') &&
        t.createdAt &&
        new Date(t.createdAt).toISOString().startsWith(todayStr)
    )
    .reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

  const liveStockOutToday = transactions
    .filter(
      (t) =>
        (t.type === 'stock_out' || t.type === 'sale') &&
        t.createdAt &&
        new Date(t.createdAt).toISOString().startsWith(todayStr)
    )
    .reduce((acc, t) => acc + (Number(t.totalQuantity) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f3f4f8] text-gray-900 font-sans antialiased selection:bg-blue-500 selection:text-white pb-10">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative flex flex-col">
        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 border border-gray-700 animate-in fade-in slide-in-from-top-3 duration-150">
            <span>{toast}</span>
          </div>
        )}

        {/* Header */}
        <Header currentTeam={currentTeam} session={session} onLogout={handleLogout} />

        {/* Home Metric Banner */}
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
              onOpenShortages={() => setShortagesModalConfig({ isOpen: true, mode: 'current' })}
              onOpenInventoryCount={() => openStockModal('adjust')}
              onOpenInviteMembers={() => setIsInviteOpen(true)}
              onOpenPastQuantity={() => setShortagesModalConfig({ isOpen: true, mode: 'by_date' })}
              onOpenBarcodeLabels={() => alert('Barcode Label Generator: Ready for thermal printer export!')}
              onOpenPurchases={() => openStockModal('purchase')}
              onOpenSales={() => openStockModal('sale')}
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
              session={session}
              onUpdateProfileName={handleUpdateProfileName}
              onLogout={handleLogout}
              onOpenInvite={() => setIsInviteOpen(true)}
              onAddLocation={handleAddLocation}
              onExportData={handleExportCSV}
              onOpenImportData={() => setIsCsvImportOpen(true)}
            />
          )}
        </main>

        {/* Bottom Navigation */}
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
          onDeleteItem={handleDeleteItem}
          onUpdateItem={handleUpdateItem}
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

        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          onInvite={handleAddMember}
        />

        <ShortagesModal
          isOpen={shortagesModalConfig.isOpen}
          onClose={() => setShortagesModalConfig((prev) => ({ ...prev, isOpen: false }))}
          items={items}
          transactions={transactions}
          initialMode={shortagesModalConfig.mode}
          onStockInItem={(item) => openStockModal('stock_in', item)}
        />

        <CsvImportModal
          isOpen={isCsvImportOpen}
          onClose={() => setIsCsvImportOpen(false)}
          onSuccess={() => {
            showToast('⚡ Stock sheet imported successfully!');
            loadData();
          }}
          teamId={currentTeam?._id || session?.activeTeamId || 'team_1'}
          operatorName={session?.userName || session?.name || 'Main Admin'}
        />
      </div>
    </div>
  );
}
