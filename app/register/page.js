'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Droplet,
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import {
  VALID_BLOOD_GROUPS,
  VALID_YEARS,
  DEPARTMENTS,
  DIVISIONS,
} from '@/lib/constants';

export default function RegisterDonorPage() {
  const router = useRouter();

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form state
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
  const [successDonor, setSuccessDonor] = useState(null);

  // Verify authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.push('/login');
          return;
        }
        setCurrentUser(data.user);
      } catch (err) {
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (successDonor) setSuccessDonor(null);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      prn: '',
      department: DEPARTMENTS[0],
      year: VALID_YEARS[2],
      division: 'A',
      mobile: '',
      age: '20',
      bloodGroup: 'O+',
      previousDonation: 'No',
      contactConsent: 'Yes',
      verificationStatus: 'Pending',
    });
    setError('');
    setSuccessDonor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessDonor(null);

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

      setSuccessDonor(data.donor);

      // Broadcast live sync to any open dashboard windows/tabs
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        try {
          const channel = new BroadcastChannel('blood_donation_sync');
          channel.postMessage({ type: 'DONOR_ADDED', donor: data.donor });
          channel.close();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">
            Verifying admin authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-rose-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-600">
              Admin Session Active: <strong className="text-slate-900">{currentUser?.name}</strong> ({currentUser?.role})
            </span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successDonor && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-md text-emerald-950 space-y-3 animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-emerald-900">
                  Donor Registered Successfully in Google Sheets!
                </h3>
                <p className="text-xs text-emerald-700">
                  Assigned Unique Donor ID:{' '}
                  <strong className="font-mono text-sm font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {successDonor.donorId}
                  </strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-xl text-xs space-y-1 font-medium border border-emerald-200">
              <p>Name: <strong>{successDonor.fullName}</strong></p>
              <p>PRN: <span className="font-mono">{successDonor.prn}</span></p>
              <p>Blood Group: <strong className="text-rose-600">{successDonor.bloodGroup}</strong></p>
              <p>Department: {successDonor.department} ({successDonor.year}, Div {successDonor.division})</p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={resetForm}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Register Another Donor</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
              >
                View in Donor Database Table
              </button>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-700 via-crimson-600 to-rose-600 p-6 sm:p-8 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                <Droplet className="w-8 h-8 fill-white" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-200 block">
                  Dedicated Registration Window
                </span>
                <h1 className="text-2xl font-black tracking-tight">
                  Donor Registration Portal
                </h1>
                <p className="text-xs text-rose-100 mt-0.5">
                  Direct live submission to Google Sheets database with atomic duplicate PRN check
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-bold text-sm block">Registration Failed:</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Medical Notice */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm mb-0.5">Important Medical Notice</strong>
                Registration does not constitute medical clearance to donate blood. Final donor fitness is evaluated by medical personnel during the blood donation camp.
              </div>
            </div>

            {/* Generated Donor ID notification */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold block text-slate-800">Sequential Donor ID:</span>
                <span className="text-slate-500">Assigned sequentially (e.g., BD-0001, BD-0002)</span>
              </div>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Auto-Generated upon submission
              </span>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
                />
              </div>

              {/* PRN (Required & Unique) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  PRN (Permanent Reg. No.) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="prn"
                  required
                  value={formData.prn}
                  onChange={handleChange}
                  placeholder="e.g. PRN2024045"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 uppercase font-mono font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Checked across entire Google Sheets database for duplicates
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Department <span className="text-rose-600">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Academic Year <span className="text-rose-600">*</span>
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Division <span className="text-rose-600">*</span>
                </label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono font-medium text-slate-900"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Blood Group <span className="text-rose-600">*</span>
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-black text-rose-700"
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Previous Donation
                </label>
                <select
                  name="previousDonation"
                  value={formData.previousDonation}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
                >
                  <option value="No">No (First-Time Donor)</option>
                  <option value="Yes">Yes (Repeat Donor)</option>
                </select>
              </div>

              {/* Contact Consent */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Contact Consent for Emergency Drives
                </label>
                <select
                  name="contactConsent"
                  value={formData.contactConsent}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium text-slate-900"
                >
                  <option value="Yes">Yes (Agrees to be contacted)</option>
                  <option value="No">No (Declined)</option>
                </select>
              </div>
            </div>

            {/* Verification Status */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-700">Initial Verification Status:</span>
              <div className="flex items-center space-x-5">
                {['Pending', 'Verified'].map((st) => (
                  <label key={st} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="verificationStatus"
                      value={st}
                      checked={formData.verificationStatus === st}
                      onChange={handleChange}
                      className="text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-crimson-600 hover:from-rose-700 hover:to-crimson-700 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 transition-all disabled:opacity-60 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Writing to Google Sheets...</span>
                  </>
                ) : (
                  <span>Register Donor to Google Sheets</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
