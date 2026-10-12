'use client';

import React from 'react';
import { Eye, Edit3, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function DonorTable({
  donors = [],
  loading = false,
  onViewDonor,
  onEditDonor,
  onDeleteDonor,
  onQuickVerify,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading donor database records from Google Sheets...</p>
      </div>
    );
  }

  if (donors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No donor records found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          No donors matched your current filter criteria or search query. Try clearing filters or register a new donor.
        </p>
      </div>
    );
  }

  const getBloodBadgeColor = (bg) => {
    switch (bg) {
      case 'O+':
      case 'O-':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'A+':
      case 'A-':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B+':
      case 'B-':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AB+':
      case 'AB-':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Verified
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 mr-1 text-amber-600" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {/* EXACT COLUMNS IN EXACT REQUESTED ORDER */}
              <th className="py-3.5 px-4 font-semibold">Donor ID</th>
              <th className="py-3.5 px-4 font-semibold">Full Name</th>
              <th className="py-3.5 px-4 font-semibold">Department</th>
              <th className="py-3.5 px-4 font-semibold">Year</th>
              <th className="py-3.5 px-4 font-semibold">Mobile</th>
              <th className="py-3.5 px-4 font-semibold">Age</th>
              <th className="py-3.5 px-4 font-semibold">Blood Group</th>
              <th className="py-3.5 px-4 font-semibold">Previous Donation</th>
              <th className="py-3.5 px-4 font-semibold">Contact Consent</th>
              {/* Actions & Status */}
              <th className="py-3.5 px-4 font-semibold text-right">Status & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {donors.map((donor) => (
              <tr
                key={donor.donorId}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* 1. Donor ID */}
                <td className="py-3 px-4 font-mono font-semibold text-rose-700 whitespace-nowrap">
                  {donor.donorId}
                </td>

                {/* 2. Full Name */}
                <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                  {donor.fullName}
                  {donor.division && (
                    <span className="ml-1.5 text-[10px] text-slate-400 font-normal">
                      (Div {donor.division})
                    </span>
                  )}
                </td>

                {/* 3. Department */}
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                  {donor.department}
                </td>

                {/* 4. Year */}
                <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                  {donor.year}
                </td>

                {/* 5. Mobile */}
                <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                  {donor.mobile}
                </td>

                {/* 6. Age */}
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                  {donor.age} yrs
                </td>

                {/* 7. Blood Group */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs border ${getBloodBadgeColor(
                      donor.bloodGroup
                    )}`}
                  >
                    {donor.bloodGroup}
                  </span>
                </td>

                {/* 8. Previous Donation */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      donor.previousDonation === 'Yes'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {donor.previousDonation === 'Yes' ? 'Yes (Repeat)' : 'No (First-time)'}
                  </span>
                </td>

                {/* 9. Contact Consent */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      donor.contactConsent === 'Yes'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {donor.contactConsent === 'Yes' ? 'Consented' : 'Declined'}
                  </span>
                </td>

                {/* Actions & Verification */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    {getStatusBadge(donor.verificationStatus)}

                    {/* Quick Verification button if pending */}
                    {donor.verificationStatus === 'Pending' && (
                      <button
                        onClick={() => onQuickVerify(donor.donorId, 'Verified')}
                        title="Mark as Verified"
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* View Details Modal (displays PRN and audit info) */}
                    <button
                      onClick={() => onViewDonor(donor)}
                      title="View Details (includes PRN and Audit metadata)"
                      className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Modal */}
                    <button
                      onClick={() => onEditDonor(donor)}
                      title="Edit Donor Record"
                      className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Confirmation */}
                    <button
                      onClick={() => onDeleteDonor(donor)}
                      title="Delete Donor Record"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
