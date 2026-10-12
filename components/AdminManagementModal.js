'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Shield, UserX, UserCheck, Key, AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminManagementModal({ isOpen, onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing form for second admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAdmins();
    }
  }, [isOpen]);

  const loadAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admins');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load administrators.');
      setAdmins(data.admins || []);

      const friend = data.admins?.find((a) => a.role === 'admin');
      if (friend) {
        setName(friend.name || '');
        setEmail(friend.email || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const secondAdmin = admins.find((a) => a.role === 'admin');
  const owner = admins.find((a) => a.role === 'owner');

  const handleToggleStatus = async (targetStatus) => {
    setUpdating(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeStatus: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update administrator.');

      setSuccessMsg(
        targetStatus === 'revoked'
          ? 'Second administrator access has been revoked immediately.'
          : 'Second administrator access has been restored.'
      );
      await loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = { name, email };
      if (newPassword) payload.newPassword = newPassword;

      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update administrator details.');

      setSuccessMsg('Second administrator details updated successfully in Google Sheets.');
      setNewPassword('');
      await loadAdmins();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Admin Access Control</h3>
              <p className="text-xs text-indigo-200">Owner-only management for Authorized Administrators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
              <UserCheck className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Administrators Cards */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Authorized Accounts in Google Sheets (Sheet 2: Admins)
            </h4>

            {/* Owner Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{owner?.name || 'Owner (Me)'}</span>
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                    OWNER
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">{owner?.email || 'owner@blooddonation.org'}</p>
              </div>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                Permanent Active
              </span>
            </div>

            {/* Second Admin Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">
                    {secondAdmin?.name || 'Second Administrator'}
                  </span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                </div>
                <p className="text-slate-500 font-mono text-[11px]">{secondAdmin?.email || 'friend@blooddonation.org'}</p>
              </div>

              {secondAdmin?.activeStatus === 'active' ? (
                <button
                  onClick={() => handleToggleStatus('revoked')}
                  disabled={updating}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Revoke Access</span>
                </button>
              ) : (
                <button
                  onClick={() => handleToggleStatus('active')}
                  disabled={updating}
                  className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Activate Access</span>
                </button>
              )}
            </div>
          </div>

          {/* Edit / Invite Second Admin Form */}
          <form onSubmit={handleSaveDetails} className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Update Second Administrator Details
            </h4>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My Friend"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@blooddonation.org"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Reset Password (Optional)
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Administrator Settings</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
