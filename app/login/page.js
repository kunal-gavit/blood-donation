'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplet, Shield, Lock, Mail, AlertTriangle, Loader2, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned status ${res.status}. The server cache might be stale, please restart the dev server.`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Authentication failed.');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (type) => {
    if (type === 'owner') {
      setEmail('owner@blooddonation.org');
      setPassword('OwnerSecure@2026');
    } else {
      setEmail('friend@blooddonation.org');
      setPassword('FriendSecure@2026');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-crimson-500 flex items-center justify-center text-white shadow-xl shadow-rose-950/60 mx-auto">
            <Droplet className="w-10 h-10 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Blood Donation Management
          </h1>
          <p className="text-xs text-rose-300 font-medium">
            Google Sheets Database • Strict Admin-Only Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-700/30 p-8 shadow-2xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-rose-600" />
              <span>Administrator Sign In</span>
            </h2>
            <p className="text-xs text-slate-500">
              Only authorized administrators can access and manage donor records.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold">Access Denied: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@blooddonation.org"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-crimson-600 hover:from-rose-700 hover:to-crimson-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          {/* Quick Credential Helper for Initial Setup */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-slate-700">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Configured Administrator Logins:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('owner')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-slate-800">1. Owner (Me)</div>
                <div className="text-[10px] text-slate-400">Click to fill</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('friend')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors"
              >
                <div className="font-bold text-slate-800">2. Second Admin</div>
                <div className="text-[10px] text-slate-400">Click to fill</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400">
          Strict authorization enforced. Public registration and signup are disabled.
        </p>
      </div>
    </div>
  );
}
