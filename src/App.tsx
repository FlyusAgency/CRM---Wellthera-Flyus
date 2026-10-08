/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Customer,
  Partner,
  ServiceBooking,
  CacChannelSpend,
  SlicerFilters,
  GoogleSheetSyncState,
} from './types';
import {
  initialCustomers,
  initialPartners,
  initialBookings,
  initialCacChannels,
  computeRfmSegment,
} from './data/initialData';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import { PowerBIHeader, ActiveTab } from './components/PowerBIHeader';
import { SlicerBar } from './components/SlicerBar';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { PartnerRoiDashboard } from './components/PartnerRoiDashboard';
import { RfmMatrixDashboard } from './components/RfmMatrixDashboard';
import { ServicesBreakdownDashboard } from './components/ServicesBreakdownDashboard';
import { CacAnalysisDashboard } from './components/CacAnalysisDashboard';
import { GoogleSheetTrackerView } from './components/GoogleSheetTrackerView';
import { WelltheraLogo } from './components/WelltheraLogo';
import { SetupInstructionsModal } from './components/SetupInstructionsModal';

export default function App() {
  // Theme state: default to false (Wellthera Signature Warm Cream from www.wellthera.ca)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Help & Setup Guide Modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Authentication State (per workspace integration skill)
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Primary Data State
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [bookings, setBookings] = useState<ServiceBooking[]>(initialBookings);
  const [cacChannels, setCacChannels] = useState<CacChannelSpend[]>(initialCacChannels);

  // Google Sheet Sync State
  const [syncState, setSyncState] = useState<GoogleSheetSyncState>({
    sheetId: null,
    sheetUrl: null,
    lastSyncedAt: null,
    isSyncing: false,
    syncMessage: null,
  });

  // Power BI Slicers State
  const [filters, setFilters] = useState<SlicerFilters>({
    dateRange: 'all',
    selectedPartners: [],
    selectedServices: [],
    selectedRfmSegments: [],
    paymentType: 'all',
    searchQuery: '',
  });

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setSyncState((prev) => ({
          ...prev,
          syncMessage: `Signed in as ${res.user.displayName || res.user.email}. Ready to sync Google Sheets.`,
        }));
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSyncState((prev) => ({
      ...prev,
      sheetId: null,
      sheetUrl: null,
      syncMessage: null,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      selectedPartners: [],
      selectedServices: [],
      selectedRfmSegments: [],
      paymentType: 'all',
      searchQuery: '',
    });
  };

  // Add customer handler
  const handleAddNewCustomer = (newCustomer: Customer) => {
    // Recompute RFM
    const { rScore, fScore, mScore, segment } = computeRfmSegment(
      newCustomer.recencyDays,
      newCustomer.totalVisits,
      newCustomer.totalSpendCAD
    );
    const enriched: Customer = {
      ...newCustomer,
      recencyScore: rScore,
      frequencyScore: fScore,
      monetaryScore: mScore,
      rfmSegment: segment,
    };

    setCustomers((prev) => [enriched, ...prev]);

    // Update partner referral counts
    setPartners((prev) =>
      prev.map((p) => {
        if (p.id === enriched.partnerId) {
          const rev = p.totalRevenueCAD + enriched.totalSpendCAD;
          const comm = (rev * p.commissionValue) / 100;
          const net = rev - (comm + p.monthlyRetainerCAD * 6);
          const roi =
            comm + p.monthlyRetainerCAD * 6 > 0
              ? (net / (comm + p.monthlyRetainerCAD * 6)) * 100
              : 0;
          return {
            ...p,
            referredCustomersCount: p.referredCustomersCount + 1,
            totalRevenueCAD: rev,
            totalCommissionPaidCAD: comm,
            netRevenueCAD: net,
            roiPercent: roi,
          };
        }
        return p;
      })
    );
  };

  // Add partner handler
  const handleAddNewPartner = (newPartner: Partner) => {
    setPartners((prev) => [newPartner, ...prev]);
  };

  // Cross-filtering computation across all visual models
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Partner filter
      if (
        filters.selectedPartners.length > 0 &&
        !filters.selectedPartners.includes(c.partnerId)
      ) {
        return false;
      }
      // Service filter
      if (
        filters.selectedServices.length > 0 &&
        !filters.selectedServices.includes(c.preferredService)
      ) {
        return false;
      }
      // RFM filter
      if (
        filters.selectedRfmSegments.length > 0 &&
        !filters.selectedRfmSegments.includes(c.rfmSegment)
      ) {
        return false;
      }
      // Payment filter
      if (filters.paymentType === 'directBilling' && c.insuranceProvider === 'None / Self-Pay') {
        return false;
      }
      if (filters.paymentType === 'outOfPocket' && c.insuranceProvider !== 'None / Self-Pay') {
        return false;
      }
      // Search
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(query);
        const matchPartner = c.partnerName.toLowerCase().includes(query);
        const matchEmail = c.email.toLowerCase().includes(query);
        const matchCode = c.referralCode.toLowerCase().includes(query);
        if (!matchName && !matchPartner && !matchEmail && !matchCode) return false;
      }
      return true;
    });
  }, [customers, filters]);

  const filteredPartners = useMemo(() => {
    if (filters.selectedPartners.length === 0) return partners;
    return partners.filter((p) => filters.selectedPartners.includes(p.id));
  }, [partners, filters.selectedPartners]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (
        filters.selectedPartners.length > 0 &&
        !filters.selectedPartners.includes(b.partnerId)
      ) {
        return false;
      }
      if (
        filters.selectedServices.length > 0 &&
        !filters.selectedServices.includes(b.serviceCategory)
      ) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchCustomer = b.customerName.toLowerCase().includes(query);
        const matchPartner = b.partnerName.toLowerCase().includes(query);
        const matchTherapist = b.therapist.toLowerCase().includes(query);
        if (!matchCustomer && !matchPartner && !matchTherapist) return false;
      }
      return true;
    });
  }, [bookings, filters]);

  const totalRevenue = bookings.reduce((acc, b) => acc + b.priceCAD, 0);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#14160e] text-[#f9f8f5] selection:bg-[#686e4a]/40'
          : 'bg-[#f9f8f5] text-[#332e1e] selection:bg-[#686e4a]/20'
      }`}
    >
      {/* Top Header & Navigation */}
      <PowerBIHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoadingAuth={isLoadingAuth}
        totalRevenue={totalRevenue}
        totalCustomers={customers.length}
        sheetUrl={syncState.sheetUrl}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Slicer Bar (Interactive Power BI Filtering) */}
      <SlicerBar
        filters={filters}
        onChange={setFilters}
        partners={partners}
        onReset={handleResetFilters}
        isDarkMode={isDarkMode}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <ExecutiveOverview
            customers={filteredCustomers}
            partners={filteredPartners}
            bookings={filteredBookings}
            cacChannels={cacChannels}
            onNavigateTab={setActiveTab}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'partners' && (
          <PartnerRoiDashboard
            partners={filteredPartners}
            customers={filteredCustomers}
            bookings={filteredBookings}
            onOpenAddPartnerModal={() => setActiveTab('sheet')}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'rfm' && (
          <RfmMatrixDashboard
            customers={filteredCustomers}
            onFilterBySegment={(seg) =>
              setFilters((prev) => ({ ...prev, selectedRfmSegments: [seg] }))
            }
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'services' && (
          <ServicesBreakdownDashboard
            bookings={filteredBookings}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'cac' && (
          <CacAnalysisDashboard
            cacChannels={cacChannels}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'sheet' && (
          <GoogleSheetTrackerView
            customers={filteredCustomers}
            partners={filteredPartners}
            bookings={filteredBookings}
            cacChannels={cacChannels}
            syncState={syncState}
            setSyncState={setSyncState}
            accessToken={accessToken}
            onAddNewCustomer={handleAddNewCustomer}
            onAddNewPartner={handleAddNewPartner}
            onOpenSignIn={handleSignIn}
            isDarkMode={isDarkMode}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        )}
      </main>

      {/* Setup Instructions & GitHub Deployment Modal */}
      <SetupInstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        isDarkMode={isDarkMode}
        hasGoogleAuth={!!accessToken}
        onOpenGoogleSheetTab={() => setActiveTab('sheet')}
      />

      {/* Footer */}
      <footer
        className={`border-t px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3 ${
          isDarkMode
            ? 'bg-[#10120b] border-[#24291c] text-[#8b927a]'
            : 'bg-[#f0ede6] border-[#e7e3da] text-[#6e6856]'
        }`}
      >
        <div className="flex items-center gap-2">
          <WelltheraLogo
            size="sm"
            variant={isDarkMode ? 'white' : 'olive'}
          />
          <span className="font-serif font-bold text-sm tracking-tight text-inherit">
            Wellthera Integrated Health
          </span>
          <span>•</span>
          <span>464 Big Bay Point Rd, Barrie, ON</span>
          <span>•</span>
          <a
            href="https://www.wellthera.ca"
            target="_blank"
            rel="noreferrer"
            className="text-[#686e4a] dark:text-[#c7ccaa] font-semibold hover:underline"
          >
            wellthera.ca
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="font-bold text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Setup & Deployment Guide</span>
            <span className="w-3.5 h-3.5 rounded-full bg-[#686e4a] text-white text-[9px] flex items-center justify-center font-bold">
              ?
            </span>
          </button>
          <span>•</span>
          <span>Google Sheets & Drive Connected</span>
          <span>•</span>
          <span>RFM Matrix v2.4</span>
        </div>
      </footer>
    </div>
  );
}
