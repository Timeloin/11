import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, Store, AlertCircle } from 'lucide-react';
import { UserSession } from '@/types';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession, token: string) => void;
  onAccessDenied: (reason: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onAccessDenied }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (res.status === 403 || data.accessDenied) {
        onAccessDenied(data.reason || 'Your shop subscription has expired or access was revoked.');
        return;
      }

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      onLoginSuccess(data.session, data.token);
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('harpreetsinghhappy7080@gmail.com');
    setPassword('@Harpreet7518');
  };

  const fillSubAdmin = () => {
    setEmail('subadmin@simranmobile.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f8] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-6">
        {/* App Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#4965fa] to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Inventory App
          </h1>
          <p className="text-xs text-gray-500">
            Sign in to access your shop & stock management
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#4965fa] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials for Fast Testing */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block text-center">
            Quick Auto-Fill Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillSuperAdmin}
              className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold text-center border border-indigo-100 transition-colors"
            >
              👑 Main Super Admin
            </button>
            <button
              type="button"
              onClick={fillSubAdmin}
              className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold text-center border border-blue-100 transition-colors"
            >
              🏪 Sub-Admin (Shop)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
