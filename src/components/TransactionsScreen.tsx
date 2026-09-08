import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowRightLeft, Sliders, ShoppingBag, Receipt, Calendar, User, Download } from 'lucide-react';
import { IStockTransaction, TransactionType } from '@/types';

interface TransactionsScreenProps {
  transactions: IStockTransaction[];
  onExport: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ transactions, onExport }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = transactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  const getBadge = (type: TransactionType) => {
    switch (type) {
      case 'stock_in':
      case 'purchase':
        return {
          label: type === 'purchase' ? 'Purchase' : 'Stock In',
          icon: ArrowDown,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'stock_out':
      case 'sale':
        return {
          label: type === 'sale' ? 'Sale' : 'Stock Out',
          icon: ArrowUp,
          bg: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'move':
        return {
          label: 'Move',
          icon: ArrowRightLeft,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'adjust':
        return {
          label: 'Adjust',
          icon: Sliders,
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      default:
        return { label: type, icon: Calendar, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Activity & Audit</h1>
          <p className="text-xs text-gray-500">Every stock update is immutably logged</p>
        </div>
        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
        {['all', 'stock_in', 'stock_out', 'move', 'adjust'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
              filterType === tab
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No transactions found for this filter.
          </div>
        ) : (
          filtered.map((txn) => {
            const badge = getBadge(txn.type);
            const Icon = badge.icon;
            const dateFormatted = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(new Date(txn.createdAt));

            return (
              <div
                key={txn._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${badge.bg}`}
                  >
                    <Icon className="w-3 h-3 stroke-[2.5]" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">{dateFormatted}</span>
                </div>

                <div>
                  {txn.items.map((line, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-900">{line.name}</span>
                      <span className="font-black text-gray-900">
                        {txn.type === 'stock_in' ? '+' : txn.type === 'stock_out' ? '-' : ''}
                        {line.quantity} pcs
                      </span>
                    </div>
                  ))}
                  {txn.reason && (
                    <p className="text-xs text-gray-500 mt-1 italic font-serif">"{txn.reason}"</p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{txn.userName}</span>
                  </div>
                  <span className="font-mono">{txn.referenceNo}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
