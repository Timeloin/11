import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Download, Check, AlertTriangle, RefreshCw } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: string;
  operatorName?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  operatorName,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadSampleTemplate = () => {
    const csvContent =
      'Name,SKU,Category,Brand,Cost Price,Selling Price,Total Stock,Safety Stock,Unit,Barcode\n' +
      'vivo V29 5G (128GB),MOB-VIVO-V29,mobile phone,vivo,15000,18999,15,5,pcs,8901234567890\n' +
      'Samsung Galaxy A15,MOB-SAM-A15,mobile phone,samsung,12000,14499,10,3,pcs,8901234567891\n' +
      'Fast Charger 65W Type-C,ACC-CHG-65W,accessories,generic,450,899,40,10,pcs,8901234567892\n' +
      'Tempered Glass Curved,ACC-GLASS-01,accessories,generic,60,199,100,20,pcs,8901234567893';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'simran_mobile_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setErrorMsg('CSV file is empty or has no header row');
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      // Regex for CSV with quoted commas
      const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const rowObj: any = {};
      headers.forEach((header, idx) => {
        const val = matches[idx] ? matches[idx].trim().replace(/^["']|["']$/g, '') : '';
        rowObj[header] = val;
      });
      if (rowObj.Name || rowObj['Item Name'] || rowObj['Product Name'] || rowObj.sku || rowObj.SKU) {
        rows.push(rowObj);
      }
    }
    return rows;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCsvText(text);
        if (rows.length === 0) {
          setErrorMsg('No valid item rows found in CSV');
        } else {
          setParsedRows(rows);
        }
      } catch (err: any) {
        setErrorMsg('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(selected);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) return;

    setIsImporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/items/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          items: parsedRows,
          operatorName: operatorName || 'Main Admin',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully imported ${data.imported || 0} new items and updated ${data.updated || 0} existing items!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.error || 'Failed to import items');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error uploading CSV');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Import Stock Sheet (.CSV)</h3>
              <p className="text-[11px] text-gray-400">Bulk upload your product catalog and quantities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {/* Template Download Banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-blue-900">Need the standard CSV format?</div>
              <div className="text-[10px] text-blue-600">Download the formatted template with sample items</div>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="py-1.5 px-3 bg-white text-blue-700 hover:bg-blue-100/50 border border-blue-200 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              file ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 hover:border-blue-400 bg-gray-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center mx-auto mb-2 text-blue-600">
              <Upload className="w-5 h-5" />
            </div>
            {file ? (
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-emerald-800">{file.name}</div>
                <div className="text-[11px] text-emerald-600">
                  {parsedRows.length} items ready to import ({Math.round(file.size / 1024)} KB)
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-700">Click to choose or drag & drop CSV file</div>
                <div className="text-[10px] text-gray-400">Supports .CSV spreadsheet exports</div>
              </div>
            )}
          </div>

          {/* Preview Table if Rows Parsed */}
          {parsedRows.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800">Preview ({parsedRows.length} items detected)</span>
                <span className="text-[10px] text-gray-400">First 4 rows shown</span>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden text-[11px]">
                <div className="bg-gray-100 font-bold text-gray-700 px-3 py-1.5 grid grid-cols-4 gap-2">
                  <span>Name</span>
                  <span>SKU</span>
                  <span>Stock</span>
                  <span>Price</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                  {parsedRows.slice(0, 4).map((row, i) => (
                    <div key={i} className="px-3 py-1.5 grid grid-cols-4 gap-2 text-gray-600 truncate">
                      <span className="font-medium text-gray-900 truncate">
                        {row.Name || row['Item Name'] || row['Product Name'] || '—'}
                      </span>
                      <span className="truncate text-gray-500">{row.SKU || row.sku || '—'}</span>
                      <span className="font-bold text-emerald-700">
                        {row['Total Stock'] || row.Stock || row.Quantity || row.totalStock || '0'}
                      </span>
                      <span className="font-bold text-blue-700">
                        ₹{row['Selling Price'] || row.Price || row.sellingPrice || '0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImportSubmit}
            disabled={isImporting || parsedRows.length === 0}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-200 transition-colors flex items-center justify-center space-x-1.5"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Import {parsedRows.length > 0 ? `${parsedRows.length} Items` : 'Items'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
