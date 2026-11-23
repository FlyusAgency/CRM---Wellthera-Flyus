import { Customer, Partner, ServiceBooking, CacChannelSpend, Practitioner, ClinicProcedure, QuarterlyOkrPlan } from '../types';
import { initialPractitioners, initialProcedures, initialOkrPlans } from '../data/initialData';

export interface WelltheraDataPackage {
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
  okrPlans?: QuarterlyOkrPlan[];
}

export const DEFAULT_TARGET_DRIVE_FOLDER_ID = '1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF';
export const DEFAULT_TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF?usp=drive_link';

export async function createWelltheraGoogleSheet(
  accessToken: string,
  data: WelltheraDataPackage,
  folderId: string = DEFAULT_TARGET_DRIVE_FOLDER_ID
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; folderMoved: boolean }> {
  // 1. Create spreadsheet with 7 sheet tabs (Instructions + 6 data tabs)
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
      {
        properties: {
          title: 'Practitioners & Team',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.20, green: 0.26, blue: 0.35 }, // Slate Navy
        },
      },
      {
        properties: {
          title: 'Procedures & Treatments',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.06, green: 0.46, blue: 0.43 }, // Teal
        },
      },
      {
        properties: {
          title: 'OKRs & Quarterly Goals',
          gridProperties: { frozenRowCount: 1 },
          tabColor: { red: 0.72, green: 0.52, blue: 0.04 }, // Amber Gold
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

  // Practitioners & Team Rows
  const practitionerHeaders = [
    'Practitioner ID',
    'Full Name',
    'Professional Title',
    'Discipline / Specialty',
    'Email',
    'Phone',
    'Status',
    'Services Offered',
  ];

  const activePractitioners = data.practitioners && data.practitioners.length > 0
    ? data.practitioners
    : initialPractitioners;

  const practitionerRows = activePractitioners.map((p) => [
    p.id,
    p.name,
    p.title,
    p.discipline,
    p.email || '',
    p.phone || '',
    p.status || 'Active',
    Array.isArray(p.servicesOffered) ? p.servicesOffered.join(', ') : (p.servicesOffered || ''),
  ]);

  // Procedures & Treatments Rows
  const procedureHeaders = [
    'Procedure ID',
    'Procedure Name',
    'Category',
    'Duration (Min)',
    'Standard Price (CAD)',
    'Insurance Eligible',
    'Avg Direct Billed (CAD)',
    'Typical Copay (CAD)',
    'Assigned Practitioners',
    'Status',
    'Clinical Description',
  ];

  const activeProcedures = data.procedures && data.procedures.length > 0
    ? data.procedures
    : initialProcedures;

  const procedureRows = activeProcedures.map((proc) => [
    proc.id,
    proc.name,
    proc.category,
    proc.durationMinutes,
    proc.priceCAD,
    proc.insuranceCovered ? 'Yes' : 'No',
    proc.typicalInsuranceBillingCAD || 0,
    proc.typicalCopayCAD || 0,
    Array.isArray(proc.assignedPractitioners)
      ? proc.assignedPractitioners.join(', ')
      : (proc.assignedPractitioners || ''),
    proc.status || 'Active',
    proc.description || '',
  ]);

  // OKRs & Quarterly Goals Rows
  const okrHeaders = [
    'Quarter',
    'Year',
    'Revenue Goal (CAD)',
    'CAC Benchmark (CAD)',
    'LTV:CAC Target',
    'New Patients Target',
    'Retention Target (%)',
    'Partner Share Target (%)',
    'Objective',
    'Owner',
    'Key Result',
    'Current Value',
    'Target Value',
    'Unit',
    'Status',
  ];

  const activeOkrs = data.okrPlans && data.okrPlans.length > 0 ? data.okrPlans : initialOkrPlans;
  const okrRows: (string | number)[][] = [];
  activeOkrs.forEach((plan) => {
    if (!plan.objectives || plan.objectives.length === 0) {
      okrRows.push([
        plan.quarter,
        plan.year,
        plan.revenueGoalCAD,
        plan.cacBenchmarkCAD,
        plan.ltvCacTargetRatio,
        plan.newPatientsTarget,
        plan.retentionTargetRate,
        plan.partnerRevenueShareTarget,
        '',
        '',
        '',
        0,
        0,
        '',
        'on_track',
      ]);
      return;
    }
    plan.objectives.forEach((obj) => {
      if (!obj.keyResults || obj.keyResults.length === 0) {
        okrRows.push([
          plan.quarter,
          plan.year,
          plan.revenueGoalCAD,
          plan.cacBenchmarkCAD,
          plan.ltvCacTargetRatio,
          plan.newPatientsTarget,
          plan.retentionTargetRate,
          plan.partnerRevenueShareTarget,
          obj.title,
          obj.owner,
          '',
          0,
          0,
          '',
          'on_track',
        ]);
        return;
      }
      obj.keyResults.forEach((kr) => {
        okrRows.push([
          plan.quarter,
          plan.year,
          plan.revenueGoalCAD,
          plan.cacBenchmarkCAD,
          plan.ltvCacTargetRatio,
          plan.newPatientsTarget,
          plan.retentionTargetRate,
          plan.partnerRevenueShareTarget,
          obj.title,
          obj.owner,
          kr.title,
          kr.currentValue,
          kr.targetValue,
          kr.unit || '',
          kr.status,
        ]);
      });
    });
  });

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
    ['Practitioners & Team', 'Clinic Manager / HR', 'When practitioner joins or updates hours', 'Manage licensed RMTs, Acupuncturist, Psychotherapist, Nurse Injector.'],
    ['Procedures & Treatments', 'Clinic Director / Clinical Lead', 'When updating pricing or services', 'Define clinical catalog, treatment lengths, typical copays and insurers.'],
    ['OKRs & Quarterly Goals', 'Executive Team / Director', 'Quarterly planning & review', 'Track quarterly revenue goals, CAC benchmarks, LTV:CAC targets, and key results.'],
    [''],
    ['2. HOW TO LOG AN APPOINTMENT / FRONT DESK STEP-BY-STEP'],
    ['Step 1', 'Patient Check-in', 'Verify if patient is registered in "Customers & RFM". If brand new, add them first.'],
    ['Step 2', 'Ask Referral Source', 'Ask: "How did you hear about Wellthera?" Record their source (e.g. GOOGLE, META, DIRECT, or a partner code).'],
    ['Step 3', 'Checkout & Payment', 'Go to "Services & Bookings Log". Add row at bottom: Booking Date, Service, Clinician, Total CAD.'],
    ['Step 4', 'Insurance Direct-Billing', 'Enter amount covered in "Direct Insurance Billed (CAD)" and copay in "Patient Out-of-Pocket (CAD)".'],
    ['Step 5', 'Auto-Sync to Dashboard', 'Open Dashboard > Google Sheets Tracker > Click "Sync to Sheet" to refresh live analytics.'],
    [''],
    ['3. ACTIVE ACQUISITION CHANNELS & PARTNER CODES'],
    ['Referral Code', 'Partner / Channel Name', 'Category', 'Commission / Notes'],
    ['DIRECT', 'No partner', 'Direct / No Partner', '$0 (Direct / Walk-in / Unattributed)'],
    ['META', 'Meta', 'Paid Social (Meta)', 'Instagram & Facebook acquisition tracking'],
    ['GOOGLE', 'Google', 'Paid & Organic Search (Google)', 'Google Search & Business Profile tracking'],
    ['CLIENT-REF', 'Existing Wellthera Client', 'Client Referral', 'Word-of-mouth referral from existing Wellthera patient'],
    ['PARTNER', 'Wellthera Partners', 'Clinic Referral Partner', 'General clinic & local business referral partner'],
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
    ['Rule 2', 'Use date format YYYY-MM-DD (e.g. 2026-11-22).'],
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
      {
        range: "'Practitioners & Team'!A1",
        values: [practitionerHeaders, ...practitionerRows],
      },
      {
        range: "'Procedures & Treatments'!A1",
        values: [procedureHeaders, ...procedureRows],
      },
      {
        range: "'OKRs & Quarterly Goals'!A1",
        values: [okrHeaders, ...okrRows],
      },
    ],
  };

  // Ensure all required tabs exist on the target spreadsheet before writing values
  const requiredTabs = [
    '📋 INSTRUCTIONS & STAFF GUIDE',
    'Customers & RFM',
    'Partners & ROI',
    'Services & Bookings Log',
    'CAC & Channel Costs',
    'Practitioners & Team',
    'Procedures & Treatments',
    'OKRs & Quarterly Goals',
  ];

  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (metaRes.ok) {
      const metaJson = await metaRes.json();
      const existingTitles = new Set<string>(
        (metaJson.sheets || []).map((s: any) => s?.properties?.title).filter(Boolean)
      );
      const missingTabs = requiredTabs.filter((title) => !existingTitles.has(title));
      if (missingTabs.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: missingTabs.map((title) => ({
              addSheet: {
                properties: {
                  title,
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            })),
          }),
        });
      }
    }
  } catch (metaErr) {
    console.warn('Sheet tab check note:', metaErr);
  }

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
/**
 * Validates and normalizes a Google Apps Script Web App deployment URL.
 * Catches common mistakes that cause HTTP 405 (e.g., pasting a Google Sheet URL,
 * Apps Script editor URL, /dev URL, or URL missing https://).
 */
export function validateAppsScriptUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl: string;
  error?: string;
} {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      normalizedUrl: '',
      error: 'Apps Script Webhook URL is empty. Paste your deployed Web App URL ending in /exec.',
    };
  }

  // Ensure protocol is present so fetch() does not post to the app origin (which returns HTTP 405)
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  if (withProtocol.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      normalizedUrl: withProtocol,
      error:
        'You pasted a Google Sheet URL into the Webhook field. Open Extensions > Apps Script > Deploy > New deployment > Web app and copy the URL ending in /exec.',
    };
  }

  if (withProtocol.includes('script.google.com/home/projects') || withProtocol.endsWith('/edit')) {
    return {
      valid: false,
      normalizedUrl: withProtocol,
      error:
        'You pasted the Apps Script Editor link instead of the deployed Web App URL. Click Deploy > New deployment > Web app and copy the URL ending in /exec.',
    };
  }

  if (withProtocol.includes('script.googleusercontent.com')) {
    return {
      valid: false,
      normalizedUrl: withProtocol,
      error:
        'You pasted a temporary redirect URL. Use the permanent Web App URL starting with https://script.google.com/macros/s/.../exec.',
    };
  }

  if (/\/dev(\?.*)?$/i.test(withProtocol)) {
    return {
      valid: false,
      normalizedUrl: withProtocol,
      error:
        'Test deployment URLs ending in /dev cannot receive external POST syncs. Use the production Web App URL ending in /exec.',
    };
  }

  // Strip /u/0/ user index segment if present (causes cross-origin auth redirects)
  const normalizedUrl = withProtocol.replace(/\/macros\/u\/\d+\/s\//i, '/macros/s/');

  const isStandardExec = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec(\?.*)?$/i.test(
    normalizedUrl
  );
  if (!isStandardExec) {
    return {
      valid: false,
      normalizedUrl,
      error:
        'Invalid Apps Script Web App URL format. It must look like: https://script.google.com/macros/s/AKfycb.../exec',
    };
  }

  return { valid: true, normalizedUrl };
}

/**
 * Safely parses JSON from an Apps Script HTTP response and provides clear guidance
 * when Google returns an HTML login/error page or HTTP 405.
 */
async function parseAppsScriptResponse(response: Response, method: 'GET' | 'POST'): Promise<any> {
  if (response.status === 405) {
    throw new Error(
      `Apps Script returned HTTP 405 (Method Not Allowed) on ${method}. Open your Google Sheet > Extensions > Apps Script, paste the latest v5.0 script (which includes doPost), then click Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy (Execute as: Me, Who has access: Anyone).`
    );
  }

  const rawText = await response.text();
  const trimmedText = rawText.trim();

  if (trimmedText.toLowerCase().startsWith('<!doctype') || trimmedText.toLowerCase().startsWith('<html')) {
    if (trimmedText.includes('doPost') || trimmedText.includes('Script function not found')) {
      throw new Error(
        'Your deployed Apps Script is missing doPost(). Paste the v5.0 Apps Script and redeploy as a New version (Deploy > Manage deployments > Edit > New version).'
      );
    }
    throw new Error(
      'Google Apps Script returned an HTML login/access page instead of JSON. In Apps Script, open Deploy > Manage deployments > set "Execute as: Me" and "Who has access: Anyone".'
    );
  }

  if (!response.ok) {
    throw new Error(`Apps Script responded with status ${response.status}${trimmedText ? `: ${trimmedText.slice(0, 140)}` : ''}`);
  }

  try {
    return JSON.parse(trimmedText);
  } catch {
    throw new Error('Apps Script returned a non-JSON response. Please redeploy the v5.0 Apps Script Web App.');
  }
}

/**
 * Syncs dashboard data directly to Google Sheets via Google Apps Script Web App
 * Uses CORS-safe text/plain POST with redirect:'follow' and clear 405/access diagnostics.
 */
export async function syncDataViaAppsScript(
  webAppUrl: string,
  data: WelltheraDataPackage
): Promise<{ success: boolean; message: string }> {
  const validation = validateAppsScriptUrl(webAppUrl);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid Apps Script Webhook URL.');
  }

  try {
    const response = await fetch(validation.normalizedUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // text/plain prevents CORS preflight OPTIONS in Google Apps Script
      },
      body: JSON.stringify({
        action: 'fullSync',
        data,
      }),
    });

    const resJson = await parseAppsScriptResponse(response, 'POST');
    if (resJson.status === 'error') {
      throw new Error(resJson.message || 'Apps Script reported an error during sync.');
    }

    return {
      success: resJson.status === 'success',
      message: resJson.message || 'Data successfully synchronized with Google Sheets via Apps Script!',
    };
  } catch (err: any) {
    console.error('Apps Script Sync Error:', err);
    throw new Error(err.message || 'Failed to sync via Apps Script: Network error or invalid URL');
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
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
  timestamp?: string;
  message?: string;
}> {
  const validation = validateAppsScriptUrl(webAppUrl);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || 'Invalid Apps Script Webhook URL.',
    };
  }

  try {
    const fetchUrl = validation.normalizedUrl.includes('?')
      ? `${validation.normalizedUrl}&action=getData&t=${Date.now()}`
      : `${validation.normalizedUrl}?action=getData&t=${Date.now()}`;

    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
    });

    const resJson = await parseAppsScriptResponse(response, 'GET');
    if (resJson.status === 'success' || resJson.customers || resJson.partners) {
      const customers = resJson.customers || [];
      const partners = resJson.partners || [];
      const bookings = resJson.bookings || [];
      const cacChannels = resJson.cacChannels || [];
      const practitioners = (resJson.practitioners && resJson.practitioners.length > 0)
        ? resJson.practitioners
        : initialPractitioners;
      const procedures = (resJson.procedures && resJson.procedures.length > 0)
        ? resJson.procedures
        : initialProcedures;

      return {
        success: true,
        customers,
        partners,
        bookings,
        cacChannels,
        practitioners,
        procedures,
        timestamp: resJson.timestamp,
        message: `Synced ${customers.length} patients, ${partners.length} partners, ${practitioners.length} practitioners, and ${bookings.length} bookings from Google Sheet!`,
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
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
  message?: string;
}> {
  try {
    const fetchTabCsv = async (candidateNames: string[]): Promise<string[][]> => {
      for (const tabName of candidateNames) {
        try {
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&t=${Date.now()}`;
          const res = await fetch(url);
          if (!res.ok) continue;
          const text = await res.text();
          if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
            throw new Error('Google Sheet is private. In Google Sheets, click "Share" > "General access" > set to "Anyone with the link can view".');
          }
          const parsed = parseCsvText(text);
          if (parsed && parsed.length > 0) return parsed;
        } catch (e: any) {
          if (e.message && e.message.includes('Anyone with the link')) throw e;
        }
      }
      return [];
    };

    // 1. Fetch Customers
    const custRows = await fetchTabCsv(['Customers & RFM', 'Customers', 'Patients & RFM', 'Patients', 'Customer', 'Patient']);
    const customers: Customer[] = [];
    if (custRows.length > 1) {
      for (let i = 1; i < custRows.length; i++) {
        const row = custRows[i];
        let id = String(row[0] || '').trim();
        let name = String(row[1] || '').trim();
        let email = String(row[2] || '').trim();
        let phone = String(row[3] || '').trim();
        let partnerName = String(row[4] || '').trim();

        // Handle case where user entered name in Column A without an ID
        if ((!name || name.includes('@')) && id && !id.startsWith('c-') && !id.toLowerCase().startsWith('id')) {
          name = id;
          id = `c-${i}`;
        }
        if (!name || name === '' || name.toLowerCase() === 'name' || name.toLowerCase() === 'patient name') continue;

        const totalVisits = Number(row[8]) || 1;
        const totalSpendCAD = Number(row[9]?.replace(/[^0-9.-]+/g, '')) || 0;
        const recencyDays = Number(row[13]) || 15;

        customers.push({
          id: id || `c-${i}`,
          name,
          email,
          phone,
          partnerId: '',
          partnerName,
          referralCode: String(row[5] || '').trim(),
          firstVisitDate: String(row[6] || ''),
          lastVisitDate: String(row[7] || ''),
          totalVisits,
          totalSpendCAD,
          preferredService: String(row[10] || 'Brazilian Lymphatic Drainage (60 Min)'),
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
    const partRows = await fetchTabCsv(['Partners & ROI', 'Partners', 'Referral Partners']);
    const partners: Partner[] = [];
    if (partRows.length > 1) {
      for (let i = 1; i < partRows.length; i++) {
        const row = partRows[i];
        let id = String(row[0] || '').trim();
        let name = String(row[1] || '').trim();

        if ((!name || name.includes('@')) && id && !id.startsWith('p-') && !id.toLowerCase().startsWith('id')) {
          name = id;
          id = `p-${i}`;
        }
        if (!name || name === '') continue;

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
          id: id || `p-${i}`,
          name,
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
    const bookRows = await fetchTabCsv(['Services & Bookings Log', 'Bookings', 'Services', 'Appointments']);
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
      const cacRows = await fetchTabCsv(['CAC & Channel Costs', 'CAC', 'Marketing Costs']);
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

    // 5. Fetch Practitioners
    const practRows = await fetchTabCsv(['Practitioners & Team', 'Practitioners', 'Team']);
    const practitioners: Practitioner[] = [];
    if (practRows.length > 1) {
      for (let i = 1; i < practRows.length; i++) {
        const row = practRows[i];
        let id = String(row[0] || '').trim();
        let name = String(row[1] || '').trim();
        if ((!name || name.includes('@')) && id && !id.startsWith('pr-')) {
          name = id;
          id = `pr-${i}`;
        }
        if (!name || name === '') continue;
        const title = String(row[2] || 'Registered Massage Therapist').trim();
        const discipline = String(row[3] || '').trim();
        const email = String(row[4] || '').trim();
        const phone = String(row[5] || '').trim();
        const status = (row[6] as any) || 'Active';
        const rawServices = String(row[7] || '').trim();
        const servicesOffered = rawServices ? rawServices.split(',').map((s) => s.trim()).filter(Boolean) : [];

        practitioners.push({
          id: id || `pr-${i}`,
          name,
          title,
          discipline,
          email,
          phone,
          status,
          servicesOffered,
        });
      }
    }

    // 6. Fetch Procedures
    const procRows = await fetchTabCsv(['Procedures & Treatments', 'Procedures', 'Treatments']);
    const procedures: ClinicProcedure[] = [];
    if (procRows.length > 1) {
      for (let i = 1; i < procRows.length; i++) {
        const row = procRows[i];
        let id = String(row[0] || '').trim();
        let name = String(row[1] || '').trim();
        if (!name && id && !id.startsWith('proc-')) {
          name = id;
          id = `proc-${i}`;
        }
        if (!name || name === '') continue;

        const category = (row[2] as any) || 'Registered Massage Therapy';
        const duration = Number(row[3]) || 60;
        const price = Number(row[4]?.replace(/[^0-9.-]+/g, '')) || 150;
        const insEligible = String(row[5] || 'Yes').toLowerCase().includes('y');
        const insBilling = Number(row[6]?.replace(/[^0-9.-]+/g, '')) || 0;
        const copay = Number(row[7]?.replace(/[^0-9.-]+/g, '')) || Math.max(0, price - insBilling);
        const rawPracs = String(row[8] || '').trim();
        const assignedPracs = rawPracs ? rawPracs.split(',').map((p) => p.trim()).filter(Boolean) : [];
        const status = (row[9] as any) || 'Active';
        const desc = String(row[10] || '').trim();

        procedures.push({
          id: id || `proc-${i}`,
          name,
          category,
          durationMinutes: duration,
          priceCAD: price,
          insuranceCovered: insEligible,
          typicalInsuranceBillingCAD: insBilling,
          typicalCopayCAD: copay,
          assignedPractitioners: assignedPracs,
          status,
          description: desc,
        });
      }
    }

    const finalPractitioners = practitioners.length > 0 ? practitioners : initialPractitioners;
    const finalProcedures = procedures.length > 0 ? procedures : initialProcedures;

    return {
      success: true,
      customers,
      partners,
      bookings,
      cacChannels,
      practitioners: finalPractitioners,
      procedures: finalProcedures,
      message: `Directly loaded ${customers.length} patients, ${partners.length} partners, ${finalPractitioners.length} practitioners, and ${bookings.length} bookings from Google Sheets!`,
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
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
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
        practitioners: res.practitioners || initialPractitioners,
        procedures: res.procedures || initialProcedures,
        message: res.message || 'Updated from Apps Script Webhook!',
        source: 'apps_script',
      };
    }
  }

  // 2. Try direct Google Sheets CSV read using sheetId
  const sheetId = syncState.sheetId || (syncState.sheetUrl ? parseSpreadsheetIdFromInput(syncState.sheetUrl) : null);
  if (sheetId) {
    const csvRes = await fetchSheetDataViaCsvExport(sheetId);
    if (
      csvRes.success &&
      (csvRes.customers?.length ||
        csvRes.partners?.length ||
        csvRes.bookings?.length ||
        csvRes.practitioners?.length ||
        csvRes.procedures?.length)
    ) {
      return {
        success: true,
        customers: csvRes.customers,
        partners: csvRes.partners,
        bookings: csvRes.bookings,
        cacChannels: csvRes.cacChannels,
        practitioners: csvRes.practitioners || initialPractitioners,
        procedures: csvRes.procedures || initialProcedures,
        message: csvRes.message || 'Updated directly from Google Sheet tabs!',
        source: 'csv_gviz',
      };
    } else if (csvRes.message) {
      return {
        success: false,
        message: csvRes.message,
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
 * Checks 2-way connection health (GET pull + POST push) of Google Apps Script Web App
 */
export async function testAppsScriptConnection(
  webAppUrl: string
): Promise<{
  success: boolean;
  getOk?: boolean;
  postOk?: boolean;
  message: string;
  details?: any;
}> {
  const validation = validateAppsScriptUrl(webAppUrl);
  if (!validation.valid) {
    return {
      success: false,
      getOk: false,
      postOk: false,
      message: validation.error || 'Invalid Apps Script URL.',
    };
  }

  let getOk = false;
  let postOk = false;
  let getDetails: any = null;
  let postError = '';

  // 1. Test GET (Pull from Sheet)
  try {
    const pingGetUrl = validation.normalizedUrl.includes('?')
      ? `${validation.normalizedUrl}&action=ping&t=${Date.now()}`
      : `${validation.normalizedUrl}?action=ping&t=${Date.now()}`;
    const getRes = await fetch(pingGetUrl, { method: 'GET', mode: 'cors', redirect: 'follow' });
    getDetails = await parseAppsScriptResponse(getRes, 'GET');
    getOk = getDetails?.status === 'success' || Array.isArray(getDetails?.customers);
  } catch (err: any) {
    return {
      success: false,
      getOk: false,
      postOk: false,
      message: `GET (Pull) check failed: ${err.message}`,
    };
  }

  // 2. Test POST (Sync / Push to Sheet)
  try {
    const postRes = await fetch(validation.normalizedUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'ping' }),
    });
    const postJson = await parseAppsScriptResponse(postRes, 'POST');
    postOk = postJson?.status === 'success';
  } catch (err: any) {
    postOk = false;
    postError = err.message;
  }

  if (getOk && postOk) {
    return {
      success: true,
      getOk: true,
      postOk: true,
      message: '2-Way Sync verified! Both Pull (GET) and Push (POST) to Google Sheets are working.',
      details: getDetails,
    };
  }

  return {
    success: false,
    getOk,
    postOk,
    message: postError || 'Pull (GET) works, but Push (POST) failed. Please redeploy v5.0 Apps Script as a New version with "Who has access: Anyone".',
    details: getDetails,
  };
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
