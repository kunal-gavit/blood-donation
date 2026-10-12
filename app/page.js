'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SummaryCards from '@/components/SummaryCards';
import DonorFilters from '@/components/DonorFilters';
import DonorTable from '@/components/DonorTable';
import AddDonorModal from '@/components/AddDonorModal';
import EditDonorModal from '@/components/EditDonorModal';
import DonorDetailsModal from '@/components/DonorDetailsModal';
import DeleteDonorModal from '@/components/DeleteDonorModal';
import AdminManagementModal from '@/components/AdminManagementModal';
import AuditLogsModal from '@/components/AuditLogsModal';
import SystemStatusModal from '@/components/SystemStatusModal';
import { ShieldAlert, AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Donors & summary state
  const [donors, setDonors] = useState([]);
  const [summary, setSummary] = useState({
    totalRegistrations: 0,
    firstTimeDonors: 0,
    repeatDonors: 0,
    contactConsents: 0,
  });
  const [totalCount, setTotalCount] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  // System status state
  const [systemStatus, setSystemStatus] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    year: '',
    department: '',
    division: '',
    bloodGroup: '',
    status: '',
  });

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [activeDonor, setActiveDonor] = useState(null);

  // Notification / toast banner
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Verify Authentication
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

  // 2. Fetch System Status
  const fetchSystemStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      if (res.ok) {
        setSystemStatus(data.status);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSystemStatus();
    }
  }, [currentUser, fetchSystemStatus]);

  // 3. Fetch Donors & Live Summary
  const fetchDonors = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.year) params.set('year', filters.year);
      if (filters.department) params.set('department', filters.department);
      if (filters.division) params.set('division', filters.division);
      if (filters.bloodGroup) params.set('bloodGroup', filters.bloodGroup);
      if (filters.status) params.set('status', filters.status);

      const res = await fetch(`/api/donors?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch donors from Google Sheets.');
      }

      setDonors(data.donors || []);
      setSummary(data.summary || {});
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, filters]);

  useEffect(() => {
    if (currentUser) {
      fetchDonors();
    }
  }, [currentUser, fetchDonors]);

  // Real-time synchronization across windows and tabs
  useEffect(() => {
    if (!currentUser || typeof window === 'undefined') return;

    // 1. Tab Focus: auto-refresh whenever switching back to Dashboard
    const handleFocus = () => {
      fetchDonors();
    };
    window.addEventListener('focus', handleFocus);

    // 2. BroadcastChannel: instantly refresh when separate /register window registers donor
    let channel;
    if (window.BroadcastChannel) {
      try {
        channel = new BroadcastChannel('blood_donation_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'DONOR_ADDED' || event.data?.type === 'DONOR_UPDATED') {
            fetchDonors();
            showToast(`Real-time update: Donor ${event.data.donor?.fullName || ''} synchronized!`);
          }
        };
      } catch {
        // ignore
      }
    }

    // 3. Periodic background sync every 15 seconds
    const interval = setInterval(() => {
      fetchDonors();
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
      clearInterval(interval);
    };
  }, [currentUser, fetchDonors]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore
    }
    router.push('/login');
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      year: '',
      department: '',
      division: '',
      bloodGroup: '',
      status: '',
    });
  };

  // Export handler (XLSX or CSV)
  const handleExport = (format) => {
    const params = new URLSearchParams();
    params.set('format', format);
    if (filters.search) params.set('search', filters.search);
    if (filters.year) params.set('year', filters.year);
    if (filters.department) params.set('department', filters.department);
    if (filters.division) params.set('division', filters.division);
    if (filters.bloodGroup) params.set('bloodGroup', filters.bloodGroup);
    if (filters.status) params.set('status', filters.status);

    // Trigger download via window location
    window.location.href = `/api/export?${params.toString()}`;
    showToast(`Generating ${format.toUpperCase()} export file from server data...`, 'info');
  };

  // Quick Verification handler
  const handleQuickVerify = async (donorId, status) => {
    try {
      const res = await fetch(`/api/donors/${donorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify donor.');
      showToast(`Donor ${donorId} marked as ${status}.`);
      fetchDonors();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : toast.type === 'info'
                ? 'bg-indigo-600 text-white border-indigo-700'
                : 'bg-emerald-600 text-white border-emerald-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        user={currentUser}
        systemStatus={systemStatus}
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenAdminModal={() => setIsAdminOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenStatusModal={() => setIsStatusOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Prominent Medical Notice */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl bg-white shadow-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <span className="font-bold">Important Medical Notice: </span>
            Registration does not constitute medical clearance to donate blood. Final donor fitness is assessed by medical professionals during the blood donation camp.
          </div>
        </div>

        {/* 4 Live Summary Cards */}
        <SummaryCards summary={summary} loading={dataLoading} />

        {/* Filters and Actions Bar */}
        <DonorFilters
          filters={filters}
          onChangeFilter={handleFilterChange}
          onResetFilters={handleResetFilters}
          onExport={handleExport}
          onOpenAddModal={() => setIsAddOpen(true)}
          onRefresh={fetchDonors}
          loading={dataLoading}
          totalCount={totalCount}
          filteredCount={donors.length}
        />

        {/* Database Error Banner if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDonors}
              className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-semibold transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Exact Donor Table */}
        <DonorTable
          donors={donors}
          loading={dataLoading}
          onViewDonor={(donor) => {
            setActiveDonor(donor);
            setIsViewOpen(true);
          }}
          onEditDonor={(donor) => {
            setActiveDonor(donor);
            setIsEditOpen(true);
          }}
          onDeleteDonor={(donor) => {
            setActiveDonor(donor);
            setIsDeleteOpen(true);
          }}
          onQuickVerify={handleQuickVerify}
        />
      </main>

      {/* Modals */}
      <AddDonorModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={(newDonor) => {
          showToast(`Donor ${newDonor.fullName} registered successfully as ${newDonor.donorId}.`);
          fetchDonors();
        }}
      />

      <EditDonorModal
        isOpen={isEditOpen}
        donor={activeDonor}
        onClose={() => {
          setIsEditOpen(false);
          setActiveDonor(null);
        }}
        onSuccess={(updatedDonor) => {
          showToast(`Donor ${updatedDonor.donorId} updated successfully in Google Sheets.`);
          fetchDonors();
        }}
      />

      <DonorDetailsModal
        isOpen={isViewOpen}
        donor={activeDonor}
        onClose={() => {
          setIsViewOpen(false);
          setActiveDonor(null);
        }}
      />

      <DeleteDonorModal
        isOpen={isDeleteOpen}
        donor={activeDonor}
        onClose={() => {
          setIsDeleteOpen(false);
          setActiveDonor(null);
        }}
        onSuccess={(donorId) => {
          showToast(`Donor ${donorId} deleted permanently from Google Sheets.`);
          fetchDonors();
        }}
      />

      {currentUser?.role === 'owner' && (
        <AdminManagementModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <SystemStatusModal
        isOpen={isStatusOpen}
        status={systemStatus}
        onClose={() => setIsStatusOpen(false)}
        onRefresh={() => {
          fetchSystemStatus();
          fetchDonors();
        }}
      />
    </div>
  );
}
