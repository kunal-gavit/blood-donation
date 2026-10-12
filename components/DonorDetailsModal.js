'use client';

import React from 'react';
import { X, Droplet, Shield, Clock, UserCheck, Calendar, Phone, Hash, ShieldAlert } from 'lucide-react';

export default function DonorDetailsModal({ isOpen, donor, onClose }) {
  if (!isOpen || !donor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-rose-500 rounded-lg">
              <Droplet className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight flex items-center space-x-2">
                <span>{donor.fullName}</span>
                <span className="font-mono text-xs bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded">
                  {donor.donorId}
                </span>
              </h3>
              <p className="text-xs text-slate-300">Authorized Admin Detailed Record</p>
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
        <div className="p-6 space-y-5 text-xs">
          {/* Medical Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-700" />
            <p>
              Registration does not constitute medical clearance to donate blood. Final fitness verified on donation day.
            </p>
          </div>

          {/* Secure PRN Display */}
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-rose-900 block">Permanent Registration Number (PRN):</span>
              <span className="font-mono text-sm font-bold text-rose-700">{donor.prn}</span>
            </div>
            <span className="text-[11px] bg-rose-200 text-rose-800 px-2.5 py-1 rounded-full font-semibold">
              Authorized Duplicate Check
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Blood Group</span>
              <span className="font-bold text-rose-600 text-sm">{donor.bloodGroup}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Mobile Number</span>
              <span className="font-mono font-semibold text-slate-800 text-sm">{donor.mobile}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Department</span>
              <span className="font-semibold text-slate-800">{donor.department}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Class & Division</span>
              <span className="font-semibold text-slate-800">
                {donor.year} (Div {donor.division})
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Age</span>
              <span className="font-semibold text-slate-800">{donor.age} years</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Previous Donation</span>
              <span className="font-semibold text-slate-800">
                {donor.previousDonation === 'Yes' ? 'Yes (Repeat Donor)' : 'No (First-time Donor)'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Contact Consent</span>
              <span className="font-semibold text-slate-800">
                {donor.contactConsent === 'Yes' ? 'Agreed to Emergency Drives' : 'Declined'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block mb-0.5">Verification Status</span>
              <span className="font-bold text-slate-800">{donor.verificationStatus}</span>
            </div>
          </div>

          {/* Metadata & Audit Information */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex justify-between">
              <span>Created By:</span>
              <span className="font-medium text-slate-700">{donor.createdBy || 'Administrator'}</span>
            </div>
            <div className="flex justify-between">
              <span>Registered On:</span>
              <span className="font-medium text-slate-700">
                {donor.registrationDate ? new Date(donor.registrationDate).toLocaleString() : 'N/A'}
              </span>
            </div>
            {donor.verifiedBy && (
              <div className="flex justify-between">
                <span>Verified By:</span>
                <span className="font-medium text-slate-700">{donor.verifiedBy}</span>
              </div>
            )}
            {donor.verifiedAt && (
              <div className="flex justify-between">
                <span>Verified At:</span>
                <span className="font-medium text-slate-700">
                  {new Date(donor.verifiedAt).toLocaleString()}
                </span>
              </div>
            )}
            {donor.consentTimestamp && (
              <div className="flex justify-between">
                <span>Consent Timestamp:</span>
                <span className="font-medium text-slate-700">
                  {new Date(donor.consentTimestamp).toLocaleString()}
                </span>
              </div>
            )}
            {donor.updatedAt && (
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-slate-700">
                  {new Date(donor.updatedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Close button */}
          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors"
            >
              Close Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
