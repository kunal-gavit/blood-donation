'use client';

import React from 'react';
import { Droplet, Shield, LogOut, Users, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function Navbar({
  user,
  systemStatus,
  onOpenAddModal,
  onOpenAdminModal,
  onOpenAuditLogs,
  onOpenStatusModal,
  onLogout,
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-crimson-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  LifeFlow Portal
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Blood Donation Registration Database
              </p>
            </div>
          </div>

          {/* Right actions & Admin profile */}
          <div className="flex items-center space-x-3">
            {/* System Connection Badge */}
            <button
              onClick={onOpenStatusModal}
              title="Click to view Google Sheets connection status"
              className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                systemStatus?.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {systemStatus?.connected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets: Live</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Storage: Local Mock</span>
                </>
              )}
            </button>

            {/* Open Registration in New Window */}
            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Donor Registration in a separate window or tab"
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
              <span>Registration Window</span>
            </a>

            {/* Audit Logs */}
            <button
              onClick={onOpenAuditLogs}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Audit Logs</span>
            </button>

            {/* Owner: Manage Second Admin */}
            {user?.role === 'owner' && (
              <button
                onClick={onOpenAdminModal}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin Access</span>
              </button>
            )}

            {/* User Profile Badge */}
            <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow">
                {user?.name ? user.name.charAt(0) : 'A'}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-900 leading-tight">
                  {user?.name || 'Administrator'}
                </div>
                <div className="text-slate-500 flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-rose-500" />
                  <span className="capitalize font-medium text-rose-600">
                    {user?.role === 'owner' ? 'Owner (Me)' : 'Second Admin'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="inline-flex items-center p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
