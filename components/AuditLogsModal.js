'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, RotateCw } from 'lucide-react';

export default function AuditLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs.');
      setLogs(data.logs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-slate-700 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Database Audit Trail</h3>
              <p className="text-xs text-slate-300">Synchronized with Google Sheets (Sheet 3: Audit Logs)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadLogs}
              title="Refresh Logs"
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-300"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl mb-4 font-medium">
              {error}
            </p>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent mb-2" />
              <p className="text-xs text-slate-500">Loading audit records from Google Sheets...</p>
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No audit logs recorded yet.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 pr-1">
              {logs.map((log, idx) => (
                <div key={idx} className="py-3 flex items-start justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">
                        {log.action}
                      </span>
                      {log.donorId && (
                        <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {log.donorId}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      By Admin: <strong className="text-slate-700">{log.adminId}</strong> • Result: {log.result}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap pl-3">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
