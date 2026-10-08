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
  // 1. Create spreadsheet with 4 sheet tabs
  const createPayload = {
    properties: {
      title: `Wellthera Integrated Health - Partner & Customer Tracking (${new Date().toLocaleDateString('en-CA')})`,
      locale: 'en_CA',
      timeZone: 'America/Toronto',
    },
    sheets: [
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

  const batchPayload = {
    valueInputOption: 'USER_ENTERED',
    data: [
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
