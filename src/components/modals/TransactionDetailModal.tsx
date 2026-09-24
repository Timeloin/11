import React, { useState } from 'react';
import { 
  X, 
  ArrowDown, 
  ArrowUp, 
  ArrowRightLeft, 
  Sliders, 
  ShoppingBag, 
  Receipt, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Hash, 
  Package, 
  FileText,
  CheckCircle2,
  RotateCcw,
  PlusCircle,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { IStockTransaction, TransactionType } from '@/types';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: IStockTransaction | null;
  onClose: () => void;
  onUndo?: (transaction: IStockTransaction) => Promise<void> | void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onUndo,
}) => {
  const [isConfirmingUndo, setIsConfirmingUndo] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  if (!isOpen || !transaction) return null;

  const getBadgeInfo = (type: TransactionType) => {
    switch (type) {
      case 'create_item':
        return {
          title: 'Item Created',
          icon: PlusCircle,
          sign: '+',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badgeBg: 'bg-emerald-600 text-white',
        };
      case 'delete_item':
        return {
          title: 'Item Deleted',
          icon: Trash2,
          sign: '-',
          color: 'text-rose-600',
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badgeBg: 'bg-rose-600 text-white',
        };
      case 'stock_in':
      case 'purchase':
        return {
          title: type === 'purchase' ? 'Purchase (Stock In)' : 'Stock In',
          icon: type === 'purchase' ? ShoppingBag : ArrowDown,
          sign: '+',
          color: 'text-blue-600',
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          badgeBg: 'bg-blue-600 text-white',
        };
      case 'stock_out':
      case 'sale':
        return {
          title: type === 'sale' ? 'Sale (Stock Out)' : 'Stock Out',
          icon: type === 'sale' ? Receipt : ArrowUp,
          sign: '-',
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200 text-red-800',
          badgeBg: 'bg-red-600 text-white',
        };
      case 'move':
        return {
          title: 'Move Stock',
          icon: ArrowRightLeft,
          sign: '⇄',
          color: 'text-amber-600',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badgeBg: 'bg-amber-600 text-white',
        };
      case 'adjust':
        return {
          title: 'Stock Adjustment',
          icon: Sliders,
          sign: '=',
          color: 'text-teal-600',
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          badgeBg: 'bg-teal-600 text-white',
        };
      default:
        return {
          title: 'Stock Transaction',
          icon: Package,
          sign: '',
          color: 'text-gray-700',
          bg: 'bg-gray-50 border-gray-200 text-gray-800',
          badgeBg: 'bg-gray-800 text-white',
        };
    }
  };

  const badge = getBadgeInfo(transaction.type);
  const Icon = badge.icon;

  const fullDate = transaction.createdAt 
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(transaction.createdAt))
    : 'Just now';

  const getUndoImpactText = () => {
    switch (transaction.type) {
      case 'delete_item':
        return 'Restores the deleted item and its stock back into your active catalog.';
      case 'create_item':
        return 'Removes/archives this newly added item from your active inventory.';
      case 'stock_in':
      case 'purchase':
        return `Deducts the added ${transaction.totalQuantity} pcs from inventory stock.`;
      case 'stock_out':
      case 'sale':
        return `Restores the deducted ${transaction.totalQuantity} pcs back into inventory stock.`;
      case 'move':
        return 'Reverts the moved quantity back to the source location.';
      case 'adjust':
        return 'Reverts this adjustment back to the previous stock count.';
      default:
        return 'Reverts this transaction and restores the previous inventory state.';
    }
  };

  const handleExecuteUndo = () => {
    if (!onUndo) return;
    setIsConfirmingUndo(false);
    onClose();
    onUndo(transaction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-xl ${badge.bg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-extrabold text-gray-900 text-base">{badge.title}</h2>
                {transaction.isUndone && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md border border-amber-300">
                    UNDONE
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-gray-400">{transaction.referenceNo}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Undone Status Notice Banner */}
          {transaction.isUndone && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-2.5 text-amber-900 text-xs">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">This transaction has been undone & restored.</span>
                <span className="text-[11px] text-amber-700">
                  Reverted by {transaction.undoneBy || 'Admin'}{' '}
                  {transaction.undoneAt ? `on ${new Date(transaction.undoneAt).toLocaleDateString()}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Main Quantity Impact Card */}
          <div className={`p-4 rounded-2xl border ${badge.bg} flex items-center justify-between`}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                {transaction.type === 'delete_item' ? 'Stock Deleted' : transaction.type === 'create_item' ? 'Initial Stock' : 'Quantity Changed'}
              </span>
              <div className="text-2xl font-black mt-0.5">
                {badge.sign}{transaction.totalQuantity} pcs
              </div>
            </div>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${badge.badgeBg}`}>
              {transaction.type.replace('_', ' ')}
            </div>
          </div>

          {/* Operator & Timestamp Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Operator & Timestamp
            </h3>
            
            <div className="flex items-center space-x-3 p-2.5 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                {transaction.userName ? transaction.userName.slice(0, 2).toUpperCase() : 'OP'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-400">Performed By</div>
                <div className="font-bold text-gray-900 text-sm truncate">
                  {transaction.userName || 'Main Admin'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-600 px-1 pt-1">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Exact Time: <strong className="text-gray-900">{fullDate}</strong></span>
            </div>
          </div>

          {/* Items In Transaction */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Items Affected
            </h3>
            <div className="space-y-2">
              {transaction.items && transaction.items.map((line, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">{line.name}</span>
                    <span className="font-black text-gray-900 text-sm">
                      {badge.sign}{line.quantity} pcs
                    </span>
                  </div>
                  {line.sku && (
                    <div className="text-[11px] font-mono text-gray-400">
                      SKU: {line.sku}
                    </div>
                  )}
                  {(line.unitCost || line.unitPrice) && (
                    <div className="text-[11px] text-gray-500 pt-0.5 flex space-x-3">
                      {line.unitPrice ? <span>Price: ₹{line.unitPrice}</span> : null}
                      {line.unitCost ? <span>Cost: ₹{line.unitCost}</span> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Locations Card */}
          {(transaction.fromLocationName || transaction.toLocationName) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Location Details
              </h3>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {transaction.fromLocationName && (
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400 block text-[11px]">From Location:</span>
                    <strong className="text-gray-900 mt-0.5 block">{transaction.fromLocationName}</strong>
                  </div>
                )}
                {transaction.toLocationName && (
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-400 block text-[11px]">To Location:</span>
                    <strong className="text-gray-900 mt-0.5 block">{transaction.toLocationName}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          {transaction.reason && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-1.5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Reason / Notes</span>
              </h3>
              <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl leading-relaxed">
                {transaction.reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {!transaction.isUndone && onUndo && !isConfirmingUndo && (
            <button
              onClick={() => setIsConfirmingUndo(true)}
              className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Undo This Transaction (Restore)</span>
            </button>
          )}

          {isConfirmingUndo && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5">
              <div className="flex items-start space-x-2 text-xs text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Undo & Restore Confirmation</strong>
                  <p className="text-[11px] text-rose-700 mt-0.5">{getUndoImpactText()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingUndo(false)}
                  disabled={isUndoing}
                  className="py-2 px-3 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteUndo}
                  disabled={isUndoing}
                  className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center space-x-1"
                >
                  {isUndoing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <span>Yes, Undo & Restore</span>
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
