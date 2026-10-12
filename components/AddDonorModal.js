'use client';

import React, { useState } from 'react';
import { X, Droplet, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { VALID_BLOOD_GROUPS, VALID_YEARS, DEPARTMENTS, DIVISIONS } from '@/lib/constants';


export default function AddDonorModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    prn: '',
    department: DEPARTMENTS[0],
    year: VALID_YEARS[2], // Third Year
    division: 'A',
    mobile: '',
    age: '20',
    bloodGroup: 'O+',
    previousDonation: 'No',
    contactConsent: 'Yes',
    verificationStatus: 'Pending',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned status ${res.status}. Please check server logs or restart the dev server.`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to register donor.');
      }

      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const channel = new BroadcastChannel('blood_donation_sync');
          channel.postMessage({ type: 'DONOR_ADDED', donor: data.donor });
          channel.close();
        } catch {
          // ignore
        }
      }

      onSuccess(data.donor);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-crimson-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Register New Donor</h3>
              <p className="text-xs text-rose-100">Writes directly to Google Sheets database</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              title="Open as full separate window"
              className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg font-medium transition-colors inline-flex items-center space-x-1"
            >
              <span>Separate Window</span>
            </a>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold">Registration Error: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Medical Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-700" />
            <p>
              <strong>Medical Notice:</strong> Registration does not constitute medical clearance to donate blood. Final fitness is determined by medical staff during donation camp.
            </p>
          </div>

          {/* Generated Donor ID notification */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Donor ID Assignment:</span>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Auto-Generated upon submission (e.g., BD-0004)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* PRN (Required & Unique) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PRN (Permanent Reg. No.) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                name="prn"
                required
                value={formData.prn}
                onChange={handleChange}
                placeholder="e.g. PRN2024045"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 uppercase font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Checked for duplicates before writing to Sheets</p>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department <span className="text-rose-600">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Year <span className="text-rose-600">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {VALID_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Division <span className="text-rose-600">*</span>
              </label>
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {DIVISIONS.map((d) => (
                  <option key={d} value={d}>
                    Division {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                required
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit number (e.g. 9876543210)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono"
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Age (18 - 65) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                name="age"
                min="18"
                max="65"
                required
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Blood Group <span className="text-rose-600">*</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-rose-700"
              >
                {VALID_BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            {/* Previous Donation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Previous Donation?
              </label>
              <select
                name="previousDonation"
                value={formData.previousDonation}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="No">No (First-Time Donor)</option>
                <option value="Yes">Yes (Repeat Donor)</option>
              </select>
            </div>

            {/* Contact Consent */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Consent for Emergency Drives?
              </label>
              <select
                name="contactConsent"
                value={formData.contactConsent}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                <option value="Yes">Yes (Agrees to be contacted)</option>
                <option value="No">No (Opted out)</option>
              </select>
            </div>
          </div>

          {/* Verification Status */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Initial Verification Status:</span>
            <div className="flex items-center space-x-3">
              {['Pending', 'Verified'].map((st) => (
                <label key={st} className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="verificationStatus"
                    value={st}
                    checked={formData.verificationStatus === st}
                    onChange={handleChange}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-rose-600 to-crimson-600 hover:from-rose-700 hover:to-crimson-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200 transition-all disabled:opacity-60 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Google Sheets...</span>
                </>
              ) : (
                <span>Register Donor</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
