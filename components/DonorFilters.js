'use client';

import React from 'react';
import { Search, RotateCcw, Download, Plus, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { VALID_BLOOD_GROUPS, VALID_YEARS, DEPARTMENTS, DIVISIONS, STATUSES } from '@/lib/constants';

export default function DonorFilters({
  filters,
  onChangeFilter,
  onResetFilters,
  onExport,
  onOpenAddModal,
  onRefresh,
  loading = false,
  totalCount,
  filteredCount,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Donor ID, Name, or PRN..."
            value={filters.search}
            onChange={(e) => onChangeFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-800 placeholder-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onChangeFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons: Refresh, Add Donor & Exports */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh data from Google Sheets"
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-crimson-600 hover:from-rose-700 hover:to-crimson-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-rose-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Donor</span>
          </button>

          <a
            href="/register"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Donor Registration in a separate window or tab"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-sm font-medium rounded-xl transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 rotate-[-90deg] text-rose-600" />
            <span>New Window</span>
          </a>

          <button
            onClick={() => onExport('xlsx')}
            title="Download genuine Excel file with current filters"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-medium rounded-xl transition-colors active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export XLSX</span>
          </button>

          <button
            onClick={() => onExport('csv')}
            title="Download CSV file with current filters"
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-sm font-medium rounded-xl transition-colors active:scale-95"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Selects */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
        {/* Academic Year */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Academic Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onChangeFilter('year', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          >
            <option value="">All Years</option>
            {VALID_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Department
          </label>
          <select
            value={filters.department}
            onChange={(e) => onChangeFilter('department', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 truncate"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Division */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Division
          </label>
          <select
            value={filters.division}
            onChange={(e) => onChangeFilter('division', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          >
            <option value="">All Divisions</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                Division {d}
              </option>
            ))}
          </select>
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Blood Group
          </label>
          <select
            value={filters.bloodGroup}
            onChange={(e) => onChangeFilter('bloodGroup', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          >
            <option value="">All Groups</option>
            {VALID_BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>

        {/* Verification Status */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Status
          </label>
          <div className="flex items-center space-x-1.5">
            <select
              value={filters.status}
              onChange={(e) => onChangeFilter('status', e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <button
              onClick={onResetFilters}
              title="Reset all filters"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter status indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing <strong className="text-slate-900">{filteredCount}</strong> of{' '}
          <strong className="text-slate-900">{totalCount}</strong> registered donors
        </span>
        {(filters.search || filters.year || filters.department || filters.division || filters.bloodGroup || filters.status) && (
          <span className="inline-flex items-center text-rose-600 font-medium">
            Filters active
          </span>
        )}
      </div>
    </div>
  );
}
