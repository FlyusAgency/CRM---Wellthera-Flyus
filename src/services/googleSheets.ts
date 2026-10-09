import { Customer, Partner, ServiceBooking, CacChannelSpend } from '../types';

export interface WelltheraDataPackage {
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
}

export const DEFAULT_TARGET_DRIVE_FOLDER_ID = '1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF';
export const DEFAULT_TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF?usp=drive_link';

export async function createWelltheraGoogleSheet(
  accessToken: string,
  data: WelltheraDataPackage,
  folderId: string = DEFAULT_TARGET_DRIVE_FOLDER_ID
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; folderMoved: boolean }> {
  // 1. Create spreadsheet with 5 sheet tabs (Instructions + 4 data tabs)
  const createPayload = {
    properties: {
      title: `Wellthera Integrated Health - Partner & Customer Tracking (${new Date().toLocaleDateString('en-CA')})`,
      locale: 'en_CA',
      timeZone: 'America/Toronto',
    },
    sheets: [
      {
        properties: {
          title: '📋 INSTRUCTIONS & STAFF GUIDE',
          gridProperties: { frozenRowCount: 2 },
          tabColor: { red: 0.25, green: 0.45, blue: 0.35 }, // Green
        },
      },
      {
        properties: {
          title: 'Customers & RFM',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.41, green: 0.43, blue: 0.29 }, // Wellthera Olive
        },
      },
      {
        properties: {
          title: 'Partners & ROI',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.90, green: 0.69, blue: 0.0 }, // Wellthera Gold
        },
      },
      {
        properties: {
          title: 'Services & Bookings Log',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.20, green: 0.18, blue: 0.12 }, // Wellthera Ink
        },
      },
      {
        properties: {
          title: 'CAC & Channel Costs',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.54, green: 0.57, blue: 0.39 }, // Light Olive
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Google Sheets API Error (${createRes.status}): ${errorText}`);
  }

  const createdSheet = await createRes.json();
  const spreadsheetId = createdSheet.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate data into all 4 tabs using batchUpdate values
  await syncDataToExistingSheet(accessToken, spreadsheetId, data);

  // 3. Move spreadsheet into the target Google Drive folder if provided
  let folderMoved = false;
  if (folderId) {
    try {
      const moveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${encodeURIComponent(folderId)}&fields=id,parents`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (moveRes.ok) {
        folderMoved = true;
      }
    } catch (driveErr) {
      console.warn('Drive folder move attempt note:', driveErr);
    }
  }

  return { spreadsheetId, spreadsheetUrl, folderMoved };
}

export async function syncDataToExistingSheet(
  accessToken: string,
  spreadsheetId: string,
  data: WelltheraDataPackage
): Promise<void> {
  // Customers Tab Rows
  const customerHeaders = [
    'Customer ID',
    'Full Name',
    'Email',
    'Phone',
    'Partner Channel',
    'Referral Code',
    'First Visit',
    'Last Visit',
    'Total Visits',
    'Total Spend (CAD)',
    'Preferred Service',
    'Insurance Provider',
    'Status',
    'Recency (Days)',
    'R-Score',
    'F-Score',
    'M-Score',
    'RFM Segment',
  ];

  const customerRows = data.customers.map((c) => [
    c.id,
    c.name,
    c.email,
    c.phone,
    c.partnerName,
    c.referralCode,
    c.firstVisitDate,
    c.lastVisitDate,
    c.totalVisits,
    c.totalSpendCAD,
    c.preferredService,
    c.insuranceProvider,
    c.status,
    c.recencyDays,
    c.recencyScore,
    c.frequencyScore,
    c.monetaryScore,
    c.rfmSegment,
  ]);

  // Partners Tab Rows
  const partnerHeaders = [
    'Partner ID',
    'Partner Name',
    'Category',
    'Contact Person',
    'Email',
    'Commission Structure',
    'Commission Rate / Flat CAD',
    'Monthly Sponsorship / Retainer (CAD)',
    'Referred Customers',
    'Active Customers',
    'Total Bookings',
    'Total Revenue (CAD)',
    'Total Commission Paid (CAD)',
    'Net Revenue (CAD)',
    'ROI %',
    'Avg Spend per Patient (CAD)',
    'Status',
  ];

  const partnerRows = data.partners.map((p) => [
    p.id,
    p.name,
    p.category,
    p.contactPerson,
    p.email,
    p.commissionType,
    p.commissionValue,
    p.monthlyRetainerCAD,
    p.referredCustomersCount,
    p.activeCustomersCount,
    p.totalBookingsCount,
    p.totalRevenueCAD,
    p.totalCommissionPaidCAD,
    p.netRevenueCAD,
    `${p.roiPercent.toFixed(1)}%`,
    p.averageCustomerSpendCAD,
    p.status,
  ]);

  // Bookings Tab Rows
  const bookingHeaders = [
    'Booking ID',
    'Customer Name',
    'Partner Source',
    'Service Category',
    'Specific Treatment',
    'Booking Date',
    'Duration (Mins)',
    'Therapist / Clinician',
    'Total Price (CAD)',
    'Direct Insurance Billed (CAD)',
    'Patient Out-of-Pocket (CAD)',
    'Status',
  ];

  const bookingRows = data.bookings.map((b) => [
    b.id,
    b.customerName,
    b.partnerName,
    b.serviceCategory,
    b.serviceTitle,
    b.bookingDate,
    b.durationMinutes,
    b.therapist,
    b.priceCAD,
    b.insuranceBilledCAD,
    b.patientPaidCAD,
    b.status,
  ]);

  // CAC Channel Rows
  const cacHeaders = [
    'Channel / Partner Name',
    'Type',
    'Category',
    'Period Month',
    'Total Spend (CAD)',
    'New Customers Acquired',
    'CAC (CAD)',
    'Avg LTV (CAD)',
    'LTV : CAC Ratio',
    'Payback Visits',
    'Payback Months',
  ];

  const cacRows = data.cacChannels.map((c) => [
    c.partnerOrChannel,
    c.isPartner ? 'Partner Referral' : 'Direct / Paid Marketing',
    c.category,
    c.month,
    c.spendCAD,
    c.newCustomersAcquired,
    c.calculatedCacCAD,
    c.averageLtvCAD,
    `${c.ltvCacRatio.toFixed(1)}x`,
    c.paybackPeriodVisits,
    c.paybackPeriodMonths,
  ]);

  // Instructions & Staff Operating Procedure (SOP) Tab Content
  const instructionRows = [
    ['WELLTHERA INTEGRATED HEALTH — CLINIC STAFF OPERATING MANUAL & SPREADSHEET GUIDE'],
    ['Target Folder URL:', DEFAULT_TARGET_DRIVE_FOLDER_URL],
    ['Target Folder ID:', DEFAULT_TARGET_DRIVE_FOLDER_ID],
    ['Last Synchronized:', new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })],
    [''],
    ['1. WORKFLOW & RESPONSIBILITIES / CLINIC STAFF ROUTINE'],
    ['Sheet Tab', 'Responsible Role', 'Frequency', 'Action Required'],
    ['Services & Bookings Log', 'Reception / Front Desk', 'Daily at every checkout', 'Add a row for each appointment: Customer Name, Service, CAD Price, Insurance split.'],
    ['Customers & RFM', 'Reception / Front Desk', 'Whenever a new patient registers', 'Add Customer ID, Full Name, Phone, Email, Referral Code, and Insurance Provider.'],
    ['Partners & ROI', 'Manager / Director', 'When a new partner agreement starts', 'Enter Partner clinic details, commission %, and monthly retainers.'],
    ['CAC & Channel Costs', 'Manager / Marketing', 'Monthly at month-end review', 'Enter monthly ad spends (Google, Meta, Retainers) and new patients acquired.'],
    [''],
    ['2. HOW TO LOG AN APPOINTMENT / FRONT DESK STEP-BY-STEP'],
    ['Step 1', 'Patient Check-in', 'Verify if patient is registered in "Customers & RFM". If brand new, add them first.'],
    ['Step 2', 'Ask Referral Source', 'Ask: "Were you referred by a doctor, gym, or coach?" Record their code (e.g. CFIT-APEX).'],
    ['Step 3', 'Checkout & Payment', 'Go to "Services & Bookings Log". Add row at bottom: Booking Date, Service, Clinician, Total CAD.'],
    ['Step 4', 'Insurance Direct-Billing', 'Enter amount covered in "Direct Insurance Billed (CAD)" and copay in "Patient Out-of-Pocket (CAD)".'],
    ['Step 5', 'Auto-Sync to Dashboard', 'Open Dashboard > Google Sheets Tracker > Click "Sync to Sheet" to refresh live analytics.'],
    [''],
    ['3. VALID PARTNER REFERRAL CODES'],
    ['Referral Code', 'Partner Clinic / Business Name', 'Agreement Type', 'Commission Value'],
    ['CFIT-APEX', 'Barrie CrossFit Apex', 'Revenue Share', '15% on booking value'],
    ['LAKE-PHYS', 'Lakeview Physiotherapy', 'Cross-Referral', '12% on booking value'],
    ['INNIS-PELV', 'Innisfil Pelvic Health', 'Flat Referral', '$25 flat per booking'],
    ['BARRIE-CHIR', 'Barrie Central Chiropractic', 'Revenue Share', '10% on booking value'],
    ['DIRECT', 'Direct / Walk-in / Organic Website', 'Organic', '$0 (No partner commission)'],
    [''],
    ['4. ACCEPTED INSURANCE PROVIDERS'],
    ['Insurance Provider (Type Exactly)', 'Direct-Billing Protocol'],
    ['Sun Life', 'eClaims portal / TELUS Health direct billing'],
    ['Manulife', 'eClaims portal direct billing'],
    ['Canada Life', 'Direct billing supported (Great-West / London Life)'],
    ['Green Shield Canada', 'Green Shield provider portal direct billing'],
    ['Blue Cross', 'Medavie Blue Cross / Ontario Blue Cross direct billing'],
    ['None / Self-Pay', 'No direct billing — 100% Patient Out-of-Pocket'],
    [''],
    ['5. GOLDEN RULES TO PREVENT DATA CORRUPTION'],
    ['Rule 1', 'DO NOT delete existing rows or alter column header names.'],
    ['Rule 2', 'Use date format YYYY-MM-DD (e.g. 2026-10-08).'],
    ['Rule 3', 'Enter prices as plain numbers without dollar signs (e.g. 150 instead of $150).'],
    ['Rule 4', 'DO NOT touch calculated RFM scores (R-Score, F-Score, M-Score, Segment) — they are calculated automatically.'],
  ];

  const batchPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'📋 INSTRUCTIONS & STAFF GUIDE'!A1",
        values: instructionRows,
      },
      {
        range: "'Customers & RFM'!A1",
        values: [customerHeaders, ...customerRows],
      },
      {
        range: "'Partners & ROI'!A1",
        values: [partnerHeaders, ...partnerRows],
      },
      {
        range: "'Services & Bookings Log'!A1",
        values: [bookingHeaders, ...bookingRows],
      },
      {
        range: "'CAC & Channel Costs'!A1",
        values: [cacHeaders, ...cacRows],
      },
    ],
  };

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload),
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`Failed to update sheet values (${updateRes.status}): ${errorText}`);
  }
}

/**
 * Extracts a valid spreadsheet ID from a raw URL or ID string
 */
export function parseSpreadsheetIdFromInput(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // Check if it's already an ID (alphanumeric, dashes, underscores)
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }
  // Try matching Google Docs URL pattern: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Syncs dashboard data directly to Google Sheets via Google Apps Script Web App
 * This bypasses OAuth limitations and token expiry!
 */
export async function syncDataViaAppsScript(
  webAppUrl: string,
  data: WelltheraDataPackage
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // text/plain prevents CORS preflight in Google Apps Script
      },
      body: JSON.stringify({
        action: 'fullSync',
        data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with status ${response.status}`);
    }

    const resJson = await response.json();
    return {
      success: resJson.status === 'success',
      message: resJson.message || 'Data successfully synchronized with Google Sheets via Apps Script!',
    };
  } catch (err: any) {
    console.error('Apps Script Sync Error:', err);
    throw new Error(`Failed to sync via Apps Script: ${err.message || 'Network error or invalid URL'}`);
  }
}

/**
 * Pulls the latest data from Google Sheets via Webhook (Google Apps Script).
 * Enables new visits, patients, and partners registered in the Spreadsheet
 * to automatically appear in the primary Dashboard without reloading the page!
 */
export async function fetchSheetDataViaAppsScript(webAppUrl: string): Promise<{
  success: boolean;
  customers?: Customer[];
  partners?: Partner[];
  bookings?: ServiceBooking[];
  cacChannels?: CacChannelSpend[];
  timestamp?: string;
  message?: string;
}> {
  try {
    const fetchUrl = webAppUrl.includes('?') 
      ? `${webAppUrl}&action=getData&t=${Date.now()}`
      : `${webAppUrl}?action=getData&t=${Date.now()}`;
      
    const response = await fetch(fetchUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Apps Script responded with status ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.status === 'success') {
      const customers = resJson.customers || [];
      const partners = resJson.partners || [];
      const bookings = resJson.bookings || [];
      const cacChannels = resJson.cacChannels || [];

      return {
        success: true,
        customers,
        partners,
        bookings,
        cacChannels,
        timestamp: resJson.timestamp,
        message: `Synced ${customers.length} patients, ${partners.length} partners, and ${bookings.length} bookings from Google Sheet!`,
      };
    }
    return {
      success: false,
      message: resJson.message || 'Failed to process Google Apps Script response.',
    };
  } catch (err: any) {
    console.error('Fetch Apps Script Error:', err);
    return {
      success: false,
      message: `Error fetching data from Webhook: ${err.message}`,
    };
  }
}

/**
 * Parses raw CSV text into array of rows handling quoted values and commas
 */
function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Direct public/shared Google Sheet CSV pull (fallback if Apps Script URL is not yet configured)
 */
export async function fetchSheetDataViaCsvExport(sheetId: string): Promise<{
  success: boolean;
  customers?: Customer[];
  partners?: Partner[];
  bookings?: ServiceBooking[];
  cacChannels?: CacChannelSpend[];
  message?: string;
}> {
  try {
    const fetchTabCsv = async (tabName: string) => {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Could not access tab "${tabName}" (${res.status})`);
      const text = await res.text();
      return parseCsvText(text);
    };

    // 1. Fetch Customers
    const custRows = await fetchTabCsv('Customers & RFM');
    const customers: Customer[] = [];
    if (custRows.length > 1) {
      for (let i = 1; i < custRows.length; i++) {
        const row = custRows[i];
        if (!row[1] || row[1] === '') continue;
        const totalVisits = Number(row[8]) || 1;
        const totalSpendCAD = Number(row[9]?.replace(/[^0-9.-]+/g, '')) || 0;
        const recencyDays = Number(row[13]) || 20;

        customers.push({
          id: String(row[0] || `c-${i}`),
          name: String(row[1] || '').trim(),
          email: String(row[2] || '').trim(),
          phone: String(row[3] || '').trim(),
          partnerId: '',
          partnerName: String(row[4] || '').trim(),
          referralCode: String(row[5] || '').trim(),
          firstVisitDate: String(row[6] || ''),
          lastVisitDate: String(row[7] || ''),
          totalVisits,
          totalSpendCAD,
          preferredService: String(row[10] || 'Brazilian Lymphatic Drainage'),
          insuranceProvider: String(row[11] || 'None / Self-Pay'),
          status: (row[12] as any) || 'Active',
          recencyDays,
          recencyScore: Number(row[14]) || 4,
          frequencyScore: Number(row[15]) || 3,
          monetaryScore: Number(row[16]) || 3,
          rfmSegment: (row[17] as any) || 'Recent Customers',
        });
      }
    }

    // 2. Fetch Partners
    const partRows = await fetchTabCsv('Partners & ROI');
    const partners: Partner[] = [];
    if (partRows.length > 1) {
      for (let i = 1; i < partRows.length; i++) {
        const row = partRows[i];
        if (!row[1] || row[1] === '') continue;
        const commType = String(row[6] || 'Percentage');
        const commVal = Number(row[7]?.replace(/[^0-9.-]+/g, '')) || (commType === 'FlatPerBooking' ? 25 : 12);
        const retainer = Number(row[8]?.replace(/[^0-9.-]+/g, '')) || 0;
        const refCount = Number(row[9]) || 0;
        const activeCount = Number(row[10]) || Math.round(refCount * 0.8);
        const bookingsCount = Number(row[11]) || refCount;
        const totalRev = Number(row[12]?.replace(/[^0-9.-]+/g, '')) || 0;
        const commPaid = Number(row[13]?.replace(/[^0-9.-]+/g, '')) || (commType === 'FlatPerBooking' ? bookingsCount * commVal : (totalRev * commVal) / 100);
        const netRev = Number(row[14]?.replace(/[^0-9.-]+/g, '')) || (totalRev - commPaid - retainer * 6);
        const roiRaw = parseFloat(String(row[15] || '').replace('%', '')) || 0;
        const avgSpend = Number(row[16]?.replace(/[^0-9.-]+/g, '')) || (refCount > 0 ? totalRev / refCount : 500);

        partners.push({
          id: String(row[0] || `p-${i}`),
          name: String(row[1] || '').trim(),
          category: (row[2] as any) || 'Physiotherapy & Chiro',
          contactPerson: String(row[3] || ''),
          email: String(row[4] || ''),
          phone: String(row[5] || ''),
          commissionType: (commType as any) || 'Percentage',
          commissionValue: commVal,
          monthlyRetainerCAD: retainer,
          referredCustomersCount: refCount,
          activeCustomersCount: activeCount,
          totalBookingsCount: bookingsCount,
          totalRevenueCAD: totalRev,
          totalCommissionPaidCAD: commPaid,
          netRevenueCAD: netRev,
          roiPercent: roiRaw,
          averageCustomerSpendCAD: avgSpend,
          status: (row[17] as any) || 'Active',
        });
      }
    }

    // 3. Fetch Bookings
    const bookRows = await fetchTabCsv('Services & Bookings Log');
    const bookings: ServiceBooking[] = [];
    if (bookRows.length > 1) {
      for (let i = 1; i < bookRows.length; i++) {
        const row = bookRows[i];
        if (!row[0] || row[0] === '') continue;
        bookings.push({
          id: String(row[0] || `b-${i}`),
          bookingDate: String(row[1] || ''),
          customerId: '',
          customerName: String(row[2] || '').trim(),
          partnerId: '',
          partnerName: String(row[3] || '').trim(),
          serviceCategory: (row[4] as any) || 'Brazilian Lymphatic Drainage',
          serviceTitle: String(row[5] || ''),
          therapist: String(row[6] || ''),
          durationMinutes: Number(row[7]) || 60,
          priceCAD: Number(row[8]?.replace(/[^0-9.-]+/g, '')) || 0,
          insuranceBilledCAD: Number(row[9]?.replace(/[^0-9.-]+/g, '')) || 0,
          patientPaidCAD: Number(row[10]?.replace(/[^0-9.-]+/g, '')) || 0,
          status: (row[11] as any) || 'Completed',
        });
      }
    }

    // 4. Fetch CAC
    let cacChannels: CacChannelSpend[] = [];
    try {
      const cacRows = await fetchTabCsv('CAC & Channel Costs');
      if (cacRows.length > 1) {
        for (let i = 1; i < cacRows.length; i++) {
          const row = cacRows[i];
          if (!row[0] || row[0] === '') continue;
          cacChannels.push({
            id: `cac-${i}`,
            partnerOrChannel: String(row[0] || '').trim(),
            isPartner: !String(row[0]).includes('Google') && !String(row[0]).includes('Instagram'),
            category: 'Partnership',
            month: String(row[1] || 'Rolling 6M'),
            spendCAD: Number(row[2]?.replace(/[^0-9.-]+/g, '')) || 0,
            newCustomersAcquired: Number(row[3]) || 0,
            calculatedCacCAD: Number(row[4]?.replace(/[^0-9.-]+/g, '')) || 0,
            averageLtvCAD: Number(row[5]?.replace(/[^0-9.-]+/g, '')) || 0,
            ltvCacRatio: parseFloat(String(row[6] || '').replace('x', '')) || 0,
            paybackPeriodVisits: Number(row[7]) || 1,
            paybackPeriodMonths: Number(row[8]) || 0.5,
          });
        }
      }
    } catch (e) {
      console.warn('CAC tab fetch note:', e);
    }

    return {
      success: true,
      customers,
      partners,
      bookings,
      cacChannels,
      message: `Directly loaded ${customers.length} patients, ${partners.length} partners, and ${bookings.length} bookings from Google Sheets!`,
    };
  } catch (err: any) {
    console.error('CSV Fetch Error:', err);
    return {
      success: false,
      message: `Failed to load via CSV: ${err.message}`,
    };
  }
}

/**
 * Unified pull function that automatically tries Webhook Apps Script,
 * then falls back to Google Sheets CSV export if sheetId is present.
 */
export async function pullLatestDataFromSpreadsheet(
  syncState: { appsScriptUrl?: string | null; sheetId?: string | null; sheetUrl?: string | null },
  _accessToken?: string | null
): Promise<{
  success: boolean;
  customers?: Customer[];
  partners?: Partner[];
  bookings?: ServiceBooking[];
  cacChannels?: CacChannelSpend[];
  message: string;
  source: 'apps_script' | 'csv_gviz' | 'none';
}> {
  // 1. Try Apps Script Webhook first (primary method)
  if (syncState.appsScriptUrl && syncState.appsScriptUrl.trim() !== '') {
    const res = await fetchSheetDataViaAppsScript(syncState.appsScriptUrl.trim());
    if (res.success && (res.customers?.length || res.partners?.length || res.bookings?.length)) {
      return {
        success: true,
        customers: res.customers,
        partners: res.partners,
        bookings: res.bookings,
        cacChannels: res.cacChannels,
        message: res.message || 'Updated from Apps Script Webhook!',
        source: 'apps_script',
      };
    }
  }

  // 2. Try direct Google Sheets CSV read using sheetId
  const sheetId = syncState.sheetId || (syncState.sheetUrl ? parseSpreadsheetIdFromInput(syncState.sheetUrl) : null);
  if (sheetId) {
    const csvRes = await fetchSheetDataViaCsvExport(sheetId);
    if (csvRes.success && (csvRes.customers?.length || csvRes.partners?.length || csvRes.bookings?.length)) {
      return {
        success: true,
        customers: csvRes.customers,
        partners: csvRes.partners,
        bookings: csvRes.bookings,
        cacChannels: csvRes.cacChannels,
        message: csvRes.message || 'Updated directly from Google Sheet tabs!',
        source: 'csv_gviz',
      };
    }
  }

  return {
    success: false,
    message: 'Please configure either a Google Apps Script Webhook URL or a Google Sheet link to pull data.',
    source: 'none',
  };
}

/**
 * Checks connection health of Google Apps Script Web App
 */
export async function testAppsScriptConnection(
  webAppUrl: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const response = await fetch(webAppUrl, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const resJson = await response.json();
    return {
      success: resJson.status === 'success',
      message: 'Connection to Google Apps Script established successfully!',
      details: resJson,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Could not connect to Apps Script: ${err.message}`,
    };
  }
}

// Client-side CSV export generator for instant download / backup
export function generateCsvDownload(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          const str = String(val ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download complete JSON package for direct import or backup
export function downloadCompleteJsonPackage(data: WelltheraDataPackage) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `wellthera_full_database_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
