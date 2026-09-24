import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MapPin,
  Download,
  LogOut,
  Database,
  Plus,
  Check,
  User,
  AlertTriangle,
  AlertOctagon,
  Smartphone,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Edit3,
  Lock,
} from 'lucide-react';
import { ITeam, ITeamMember, ILocation, UserSession } from '@/types';
import { EditMemberModal } from '@/components/modals/EditMemberModal';
import { hasPermission } from '@/lib/permissions';

interface SettingsScreenProps {
  team: ITeam | null;
  members: ITeamMember[];
  locations: ILocation[];
  session?: UserSession | null;
  onUpdateProfileName?: (name: string) => Promise<void>;
  onLogout?: () => void;
  onOpenInvite: () => void;
  onAddLocation: (name: string) => Promise<void>;
  onExportData: () => void;
  onOpenImportData?: () => void;
  onDeleteAllItems?: (adminPassword?: string) => Promise<void> | void;
  onUpdateMember?: (memberId: string, data: any) => Promise<void>;
  onDeleteMember?: (memberId: string) => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  team,
  members,
  locations,
  session,
  onUpdateProfileName,
  onLogout,
  onOpenInvite,
  onAddLocation,
  onExportData,
  onOpenImportData,
  onDeleteAllItems,
  onUpdateMember,
  onDeleteMember,
}) => {
  const [newLocName, setNewLocName] = useState('');
  const [addingLoc, setAddingLoc] = useState(false);

  // Profile Name Editing state
  const [profileName, setProfileName] = useState(session?.userName || '');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Member edit & delete state
  const [editingMember, setEditingMember] = useState<ITeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<ITeamMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Delete all items 3-step modal state
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2 | 3>(1);
  const [typedConfirmText, setTypedConfirmText] = useState('');
  const [deleteAllAdminPassword, setDeleteAllAdminPassword] = useState('');
  const [deleteAllError, setDeleteAllError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // App Icon state
  const [appIconPreview, setAppIconPreview] = useState<string>('/api/app-icon');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [iconSavedSuccess, setIconSavedSuccess] = useState(false);
  const [iconError, setIconError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const isAdmin = session?.role === 'admin';
  const canManageStaff = isAdmin || hasPermission(session, 'canManageMembers');

  useEffect(() => {
    if (session?.userName) {
      setProfileName(session.userName);
    }
  }, [session?.userName]);

  useEffect(() => {
    try {
      const localCached = localStorage.getItem('simran_app_icon');
      if (localCached) {
        setAppIconPreview(localCached);
      } else if (team?.appIcon) {
        setAppIconPreview(team.appIcon);
      } else {
        setAppIconPreview(`/api/app-icon?t=${Date.now()}`);
      }
    } catch (e) {
      setAppIconPreview(`/api/app-icon?t=${Date.now()}`);
    }
  }, [team?.appIcon]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !onUpdateProfileName) return;
    setIsSavingName(true);
    try {
      await onUpdateProfileName(profileName.trim());
      setNameSavedSuccess(true);
      setTimeout(() => setNameSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAddLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;
    await onAddLocation(newLocName.trim());
    setNewLocName('');
    setAddingLoc(false);
  };

  const handleConfirmDeleteMember = () => {
    if (!deletingMember || !onDeleteMember) return;
    const memberId = deletingMember._id;
    setDeletingMember(null);
    onDeleteMember(memberId);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setIconError('Image size should be less than 4MB');
      return;
    }

    setIconError(null);
    setIsUploadingIcon(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.fillStyle = '#4965fa';
          ctx.fillRect(0, 0, 512, 512);

          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 512, 512);

          const base64Data = canvas.toDataURL('image/png', 0.95);
          setAppIconPreview(base64Data);

          try {
            localStorage.setItem('simran_app_icon', base64Data);
          } catch (e) {}

          // Update live DOM tags in head
          const iconLinks = document.querySelectorAll("link[rel*='icon'], link[rel*='apple-touch-icon']");
          iconLinks.forEach((link: any) => {
            link.href = `/api/app-icon?t=${Date.now()}`;
          });

          const res = await fetch('/api/app-icon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: team?._id || 'team_1',
              appIcon: base64Data,
            }),
          });

          const data = await res.json();
          if (data.success) {
            setIconSavedSuccess(true);
            setTimeout(() => setIconSavedSuccess(false), 3000);
          } else {
            setIconError(data.error || 'Failed to save icon');
          }
          setIsUploadingIcon(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIconError(err.message || 'Error processing image');
      setIsUploadingIcon(false);
    }
  };

  return (
    <div className="px-4 py-4 space-y-4 pb-28 max-w-md mx-auto">
      {/* Profile & Name Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">User Profile</h2>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between items-center py-1 border-b border-gray-50">
            <span className="text-gray-400">Account Email:</span>
            <span className="font-semibold text-gray-800">{session?.email || 'admin@shop.com'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-gray-50">
            <span className="text-gray-400">Role:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isAdmin ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              {session?.role || 'Admin'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-gray-700 block">
            Display Name / Operator Name
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter your name (e.g. Harpreet Singh)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSavingName || !profileName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1"
            >
              {nameSavedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : isSavingName ? (
                <span>Saving...</span>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-400">
            This name will be stamped on all inventory transactions, stock ins/outs, and history logs you record.
          </p>
        </form>
      </div>

      {/* App Logo & Custom Branding (Saved to DB) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-gray-900">App Logo & Icon</h2>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
            Database Saved
          </span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Upload your shop logo. This icon is saved in the database and is automatically used when adding <strong>Simran Mobile</strong> to your iPhone or Android Home Screen.
        </p>

        <div className="flex items-center space-x-4 pt-1">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-indigo-100 bg-gray-50 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appIconPreview}
              alt="Simran Mobile Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/api/app-icon';
              }}
            />
            {isUploadingIcon && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingIcon}
              className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors flex items-center justify-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploadingIcon ? 'Uploading...' : 'Upload New Logo'}</span>
            </button>
            <div className="text-[10px] text-gray-400">
              Supports PNG, JPG, WEBP. Auto-cropped to 512×512 HD.
            </div>
          </div>
        </div>

        {iconSavedSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>App icon updated and saved to database!</span>
          </div>
        )}

        {iconError && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{iconError}</span>
          </div>
        )}
      </div>

      {/* Install Mobile Web App (PWA Standalone Mode) */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-yellow-300" />
            <h3 className="font-bold text-sm tracking-wide">Install Simran Mobile App</h3>
          </div>
          <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
            PWA Standalone
          </span>
        </div>

        <p className="text-xs text-blue-100 leading-relaxed">
          Install the web app on your phone to run in full-screen standalone mode without any browser URL bars—just like a native mobile app!
        </p>

        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>📲 Tap Here to Install App on Android</span>
          </button>
        )}

        {isInstalled && (
          <div className="p-2 bg-emerald-500/20 border border-emerald-300/40 rounded-xl flex items-center space-x-2 text-xs font-semibold text-emerald-200">
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Simran Mobile is installed and active in standalone app mode!</span>
          </div>
        )}

        {/* Installation Guides */}
        <div className="space-y-2 pt-1">
          {/* Android Chrome Instructions */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 text-xs space-y-1.5 border border-white/10">
            <div className="font-bold text-yellow-200 flex items-center space-x-1">
              <span>🤖 Android (Google Chrome)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-50 leading-relaxed">
              <li>Open this website in <strong>Google Chrome</strong>.</li>
              <li>Tap the <strong>3 dots (⋮)</strong> menu in the top-right corner.</li>
              <li>Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</li>
              <li>The app opens in standalone mode without browser bars!</li>
            </ol>
          </div>

          {/* iPhone Safari Instructions */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 text-xs space-y-1.5 border border-white/10">
            <div className="font-bold text-yellow-200 flex items-center space-x-1">
              <span>🍎 iPhone / iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-50 leading-relaxed">
              <li>Open this website in <strong>Safari</strong>.</li>
              <li>Tap the <strong>Share</strong> button <span className="inline-block px-1 bg-white/20 rounded text-[10px]">📤</span> at the bottom.</li>
              <li>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong> <span className="inline-block px-1 bg-white/20 rounded text-[10px]">➕</span>.</li>
              <li>Your custom shop logo and <strong>Simran Mobile</strong> icon will appear on your home screen!</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Shop Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop Details</h2>
        <div className="text-lg font-bold text-gray-900">{team?.name || 'Simran Mobile'}</div>
        <div className="flex items-center justify-between pt-2 text-xs text-gray-600">
          <span>Store: <strong className="font-semibold text-gray-800">{team?.name || 'Simran Mobile'}</strong></span>
          <span>Currency: <strong className="font-bold">{team?.currency || '₹'}</strong></span>
        </div>
      </div>

      {/* Staff & Members Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm">Staff & Members ({members.length})</h3>
          </div>
          {canManageStaff && (
            <button
              onClick={onOpenInvite}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400 bg-gray-50 rounded-xl">
            No staff members added yet. {canManageStaff && 'Click "+ Add Member" to invite staff.'}
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const p = m.customPermissions;
              const isRo = p?.isReadOnly || m.role === 'viewer';
              return (
                <div
                  key={m._id}
                  className="p-2.5 bg-gray-50 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-gray-900 truncate">{m.name}</span>
                        {isRo ? (
                          <span className="px-1.5 py-0.5 rounded uppercase font-bold text-[9px] bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            Read Only
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded uppercase font-bold text-[9px] bg-blue-100 text-blue-800 shrink-0">
                            Staff
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[11px] truncate">{m.email}</div>
                    </div>

                    {canManageStaff && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingMember(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Member"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMember(m)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Permission Pills */}
                  {!isRo && p && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {p.canCreateItem && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">+Item</span>}
                      {p.canEditItem && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">Edit</span>}
                      {p.canDeleteItem && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-50 text-red-700 border border-red-100">Delete</span>}
                      {p.canStockIn && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Stock In</span>}
                      {p.canStockOut && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-50 text-orange-700 border border-orange-100">Stock Out</span>}
                      {p.canCreateSale && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">Sales</span>}
                      {p.canCreatePurchase && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">Purchase</span>}
                      {p.canAdjustStock && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">Adjust</span>}
                      {p.canMoveStock && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-100">Move</span>}
                      {p.canManageMembers && <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">Add Staff</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Locations Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-gray-900 text-sm">Inventory Locations</h3>
          </div>
          <button
            onClick={() => setAddingLoc(!addingLoc)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            {addingLoc ? 'Cancel' : '+ Add Location'}
          </button>
        </div>

        {addingLoc && (
          <form onSubmit={handleAddLoc} className="flex space-x-2 pt-1">
            <input
              type="text"
              placeholder="Location name (e.g. Rack B)"
              value={newLocName}
              onChange={(e) => setNewLocName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-xl font-bold"
            >
              Save
            </button>
          </form>
        )}

        <div className="space-y-1.5">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-xs"
            >
              <span className="font-medium text-gray-800">{loc.name}</span>
              {loc.isDefault && (
                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Import, Export & Backup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-gray-900 text-sm">Data Backup & Excel/CSV</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Import new stock items from a CSV spreadsheet, or export your full catalog and transaction history.
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onOpenImportData && (
            <button
              type="button"
              onClick={onOpenImportData}
              className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportData}
            className={`py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center space-x-1.5 shadow-xs ${
              !onOpenImportData ? 'col-span-2' : ''
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Wipe All Inventory (Admin Only) */}
      {onDeleteAllItems && isAdmin && (
        <div className="bg-red-50/70 rounded-2xl border border-red-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center space-x-2 text-red-700">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-sm">Danger Zone</h3>
          </div>
          <p className="text-xs text-red-600/90 leading-relaxed">
            Delete all stock items from your catalog at once. Protected with a 3-step security verification and Admin Password check.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteStep(1);
              setTypedConfirmText('');
              setDeleteAllAdminPassword('');
              setDeleteAllError('');
              setShowDeleteAllModal(true);
            }}
            className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Items (3-Step Verification)</span>
          </button>
        </div>
      )}

      {/* Database Connection Notice */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-2xl p-4 text-white space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
          <Database className="w-4 h-4" />
          <span>MongoDB Atlas Connected</span>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed">
          Simran Mobile is configured for production. Custom app icons, member permissions, safety stocks, and operator-stamped transactions are synchronized with MongoDB Atlas.
        </p>
      </div>

      {/* Sign Out Button */}
      {onLogout && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 border border-red-200 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && onUpdateMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          member={editingMember as any}
          onClose={() => setEditingMember(null)}
          onUpdate={async (memberId, data) => {
            await onUpdateMember(memberId, data);
            setEditingMember(null);
          }}
        />
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Remove Staff Member?</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to remove <strong className="text-gray-800">{deletingMember.name}</strong> ({deletingMember.email}) from staff members? They will no longer be able to log in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={isDeletingMember}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                disabled={isDeletingMember}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 transition-colors"
              >
                {isDeletingMember ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Sign Out Confirmation</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to sign out from <strong className="text-gray-700">{session?.email || 'your account'}</strong>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 transition-colors"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Items 3-Step Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-red-100 animate-in zoom-in-95">
            {/* Step 1 */}
            {deleteStep === 1 && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                    Confirmation 1 of 3
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Delete All Inventory Items?
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    You are requesting to erase every single stock item in your shop catalog. Are you sure you want to continue?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    Next (Step 2/3) ➔
                  </button>
                </div>
              </>
            )}

            {/* Step 2 */}
            {deleteStep === 2 && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                    Confirmation 2 of 3
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Warning: Irreversible Action!
                  </h3>
                  <p className="text-xs text-red-600 leading-relaxed font-medium">
                    All inventory quantities, pricing, SKUs, and stock records will be wiped. This action cannot be undone.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(3)}
                    className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    I Understand ➔
                  </button>
                </div>
              </>
            )}

            {/* Step 3 */}
            {deleteStep === 3 && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                    Confirmation 3 of 3 (Final)
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Type DELETE ALL & Enter Password
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Type <strong className="text-red-600 font-mono">DELETE ALL</strong> and enter your Admin Password.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <input
                      type="text"
                      value={typedConfirmText}
                      onChange={(e) => setTypedConfirmText(e.target.value)}
                      placeholder="Type DELETE ALL"
                      className="w-full text-center tracking-widest font-mono font-bold text-xs px-3 py-2 bg-gray-50 border-2 border-red-200 rounded-xl text-red-600 focus:outline-none focus:border-red-500 focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={deleteAllAdminPassword}
                      onChange={(e) => {
                        setDeleteAllAdminPassword(e.target.value);
                        setDeleteAllError('');
                      }}
                      placeholder="Enter Admin Password"
                      className="w-full text-center font-mono text-xs px-3 py-2 bg-gray-50 border border-red-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  {deleteAllError && (
                    <p className="text-[10px] text-red-600 font-semibold text-center">{deleteAllError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteAllModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      typedConfirmText.trim() !== 'DELETE ALL' ||
                      !deleteAllAdminPassword.trim() ||
                      isDeleting
                    }
                    onClick={async () => {
                      if (typedConfirmText.trim() !== 'DELETE ALL') return;
                      if (!deleteAllAdminPassword.trim()) {
                        setDeleteAllError('Admin password required');
                        return;
                      }
                      setIsDeleting(true);
                      try {
                        if (onDeleteAllItems) {
                          await onDeleteAllItems(deleteAllAdminPassword.trim());
                        }
                        setShowDeleteAllModal(false);
                      } catch (err: any) {
                        setDeleteAllError(err.message || 'Failed to delete items');
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-md shadow-red-300 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Everything'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

