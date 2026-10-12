'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink, Database, Key } from 'lucide-react';

export default function SystemStatusModal({ isOpen, status, onClose, onRefresh }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-700 rounded-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Google Sheets Connection Status</h3>
              <p className="text-xs text-slate-300">Database Integration & Diagnostics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status Alert */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              status?.connected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {status?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="font-bold text-sm">
                {status?.connected ? 'Connected to Google Sheets API' : 'Running in Local Simulation Mode'}
              </h4>
              <p className="text-xs opacity-90">{status?.message}</p>
              {status?.spreadsheetTitle && (
                <p className="text-xs font-semibold">
                  Spreadsheet: <span className="font-bold">{status.spreadsheetTitle}</span>
                </p>
              )}
            </div>
          </div>

          {/* Environment Variables Checklist */}
          <div className="space-y-2 pt-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Server Environment Variables
            </h4>
            <div className="space-y-2 font-mono">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>GOOGLE_SHEETS_SPREADSHEET_ID</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status?.details?.spreadsheetId === 'Configured' || status?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {status?.connected || status?.details?.spreadsheetId === 'Configured' ? 'ACTIVE' : 'NOT SET'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>GOOGLE_SERVICE_ACCOUNT_EMAIL</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status?.details?.clientEmail === 'Configured' || status?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {status?.connected || status?.details?.clientEmail === 'Configured' ? 'ACTIVE' : 'NOT SET'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status?.details?.privateKey === 'Configured' || status?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {status?.connected || status?.details?.privateKey === 'Configured' ? 'ACTIVE' : 'NOT SET'}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span>AUTH_SECRET</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  PROTECTED
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="font-bold text-slate-800 block">Worksheets Schema:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li><strong>Donors:</strong> 18 columns (Donor ID through Updated At)</li>
              <li><strong>Admins:</strong> 6 columns (Admin ID through Created At)</li>
              <li><strong>Audit Logs:</strong> 5 columns (Timestamp through Result)</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors"
            >
              Recheck Connection
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
