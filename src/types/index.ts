export type RfmSegment =
  | 'Champions'
  | 'Loyal Customers'
  | 'Potential Loyalists'
  | 'Recent Customers'
  | 'Promising'
  | 'Needs Attention'
  | 'At Risk'
  | 'Can\'t Lose Them'
  | 'Hibernating';

export type CustomerStatus = 'Active' | 'At Risk' | 'Churned' | 'VIP';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  partnerId: string;
  partnerName: string;
  referralCode: string;
  firstVisitDate: string;
  lastVisitDate: string;
  totalVisits: number;
  totalSpendCAD: number;
  preferredService: string;
  insuranceProvider: string;
  status: CustomerStatus;
  recencyDays: number;
  recencyScore: number; // 1 to 5
  frequencyScore: number; // 1 to 5
  monetaryScore: number; // 1 to 5
  rfmSegment: RfmSegment;
  notes?: string;
}

export type PartnerCategory =
  | 'Fitness & CrossFit'
  | 'Physiotherapy & Chiro'
  | 'OB-GYN, Doulas & Pelvic Health'
  | 'MedSpa & Aesthetics'
  | 'Local Wellness Influencer'
  | 'Corporate Wellness';

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  contactPerson: string;
  email: string;
  phone: string;
  commissionType: 'Percentage' | 'FlatPerBooking' | 'CoMarketingRetainer';
  commissionValue: number; // e.g. 15 for 15% or $30 flat
  referralCode?: string;
  monthlyRetainerCAD: number; // if co-marketing/sponsorship
  referredCustomersCount: number;
  activeCustomersCount: number;
  totalBookingsCount: number;
  totalRevenueCAD: number;
  totalCommissionPaidCAD: number;
  netRevenueCAD: number;
  roiPercent: number; // ((Net - Retainer) / Cost) * 100
  averageCustomerSpendCAD: number;
  status: 'Active' | 'Paused' | 'Prospect';
}

export type ServiceCategory =
  | 'Registered Massage Therapy'
  | 'Brazilian Lymphatic Drainage'
  | 'Acupuncture'
  | 'Nurse-Led Injectables'
  | 'Psychotherapy';

export interface ServiceBooking {
  id: string;
  customerId: string;
  customerName: string;
  partnerId: string;
  partnerName: string;
  serviceCategory: ServiceCategory;
  serviceTitle: string;
  bookingDate: string;
  durationMinutes: number;
  therapist: string;
  priceCAD: number;
  insuranceBilledCAD: number;
  patientPaidCAD: number;
  status: 'Completed' | 'Upcoming' | 'Cancelled';
}

export interface CacChannelSpend {
  id: string;
  partnerOrChannel: string;
  isPartner: boolean;
  category: string;
  month: string;
  spendCAD: number;
  newCustomersAcquired: number;
  calculatedCacCAD: number;
  averageLtvCAD: number;
  ltvCacRatio: number;
  paybackPeriodVisits: number;
  paybackPeriodMonths: number;
}

export interface SlicerFilters {
  dateRange: 'all' | '30d' | '90d' | '180d' | '365d';
  selectedPartners: string[]; // ids or 'all'
  selectedServices: string[]; // ServiceCategory or 'all'
  selectedRfmSegments: string[]; // RfmSegment or 'all'
  paymentType: 'all' | 'directBilling' | 'outOfPocket';
  searchQuery: string;
}

export interface GoogleSheetSyncState {
  sheetId: string | null;
  sheetUrl: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  syncMessage: string | null;
}
