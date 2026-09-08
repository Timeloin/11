import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, PlusCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { IItem } from '@/types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoundItem: (item: IItem, action?: 'view' | 'stock_in' | 'stock_out') => void;
  onCreateWithBarcode: (code: string) => void;
  teamId: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onFoundItem,
  onCreateWithBarcode,
  teamId,
}) => {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchingItem, setMatchingItem] = useState<IItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setScannedCode(null);
      setMatchingItem(null);
      return;
    }

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('barcode-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.333,
          },
          async (decodedText) => {
            if (decodedText && decodedText !== scannedCode) {
              setScannedCode(decodedText);
              // Audio beep feedback
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
              } catch (e) {}

              // Lookup item
              setSearching(true);
              const res = await fetch(`/api/items/barcode?teamId=${teamId}&code=${encodeURIComponent(decodedText)}`);
              const data = await res.json();
              setSearching(false);
              if (data.found && data.item) {
                setMatchingItem(data.item);
              } else {
                setMatchingItem(null);
              }
            }
          },
          (errorMessage) => {
            // Scanner frame ignore
          }
        );
      } catch (err: any) {
        console.warn('Camera failed or permission denied:', err);
        setCameraError(err.message || 'Camera permission required for scanning');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, teamId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-900">Barcode Scanner</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          <div id="barcode-reader" className="w-full"></div>

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gray-900/90">
              <p className="text-sm font-medium mb-3 text-red-300">{cameraError}</p>
              <p className="text-xs text-gray-300">You can also enter a test barcode manually:</p>
              <div className="flex space-x-2 mt-3 w-full">
                <input
                  type="text"
                  placeholder="e.g. 8901234567890"
                  className="flex-1 bg-white text-gray-900 text-xs px-3 py-2 rounded-lg"
                  onChange={(e) => setScannedCode(e.target.value)}
                />
                <button
                  onClick={async () => {
                    if (scannedCode) {
                      setSearching(true);
                      const res = await fetch(`/api/items/barcode?teamId=${teamId}&code=${encodeURIComponent(scannedCode)}`);
                      const data = await res.json();
                      setSearching(false);
                      if (data.found && data.item) setMatchingItem(data.item);
                    }
                  }}
                  className="bg-blue-600 px-3 py-2 text-white text-xs font-semibold rounded-lg"
                >
                  Find
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scanned Result Banner */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
          {scannedCode ? (
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Scanned Code
              </div>
              <div className="text-sm font-mono font-bold text-gray-900 mt-0.5">
                {scannedCode}
              </div>

              {searching && (
                <div className="text-xs text-blue-600 font-medium mt-2 flex items-center space-x-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Looking up inventory...</span>
                </div>
              )}

              {!searching && matchingItem && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="font-bold text-gray-900 text-sm">{matchingItem.name}</div>
                  <div className="text-xs text-gray-500 flex justify-between mt-1">
                    <span>Stock: <strong className="text-gray-900">{matchingItem.totalStock}</strong> {matchingItem.unit}</span>
                    <span className="text-blue-600 font-bold">₹{matchingItem.sellingPrice}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => {
                        onFoundItem(matchingItem, 'stock_in');
                        onClose();
                      }}
                      className="flex items-center justify-center space-x-1 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>Stock In</span>
                    </button>
                    <button
                      onClick={() => {
                        onFoundItem(matchingItem, 'stock_out');
                        onClose();
                      }}
                      className="flex items-center justify-center space-x-1 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg hover:bg-red-100"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      <span>Stock Out</span>
                    </button>
                  </div>
                </div>
              )}

              {!searching && !matchingItem && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <p className="text-xs text-amber-600 font-medium">No matching item in inventory.</p>
                  <button
                    onClick={() => {
                      onCreateWithBarcode(scannedCode);
                      onClose();
                    }}
                    className="w-full mt-2.5 flex items-center justify-center space-x-1.5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create New Item with this Code</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-center text-gray-500">
              Align barcode / QR code within frame to scan automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
