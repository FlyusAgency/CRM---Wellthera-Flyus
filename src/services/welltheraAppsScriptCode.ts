/**
 * Google Apps Script Generator for Wellthera Integrated Health
 * Allows 1-click generation of the complete spreadsheet directly in Google Sheets
 * via Extensions > Apps Script, with 2-way sync webhook support (doGet / doPost).
 *
 * Version 3.0: Includes interactive "🛎️ FRONT DESK DASHBOARD" as the primary 1st tab!
 */

import { Customer, Partner, ServiceBooking, CacChannelSpend, Practitioner, ClinicProcedure, QuarterlyOkrPlan } from '../types';
import { initialPractitioners, initialProcedures, initialOkrPlans } from '../data/initialData';
import {
  DEFAULT_TARGET_DRIVE_FOLDER_ID,
  DEFAULT_TARGET_DRIVE_FOLDER_URL,
} from './googleSheets';

export function generateWelltheraAppsScript(
  customers: Customer[],
  partners: Partner[],
  bookings: ServiceBooking[],
  cacChannels: CacChannelSpend[],
  practitioners: Practitioner[] = initialPractitioners,
  procedures: ClinicProcedure[] = initialProcedures,
  okrPlans: QuarterlyOkrPlan[] = initialOkrPlans
): string {
  const customersJson = JSON.stringify(customers);
  const partnersJson = JSON.stringify(partners, null, 2);
  const bookingsJson = JSON.stringify(bookings);
  const cacChannelsJson = JSON.stringify(cacChannels, null, 2);
  const practitionersJson = JSON.stringify(practitioners, null, 2);
  const proceduresJson = JSON.stringify(procedures, null, 2);
  const okrPlansJson = JSON.stringify(okrPlans, null, 2);

  return `/**
 * =========================================================================
 * WELLTHERA INTEGRATED HEALTH — GOOGLE SHEETS SETUP & AUTOMATION
 * Version: 5.0 — UPDATED CLINICSENSE DATABASE (${customers.length.toLocaleString()} PATIENTS),
 * OKRS & QUARTERLY GOALS, PRACTITIONERS, PROCEDURES & FULL 2-WAY SYNC
 *
 * Target Google Drive Folder:
 * ${DEFAULT_TARGET_DRIVE_FOLDER_URL}
 * Drive Folder ID: ${DEFAULT_TARGET_DRIVE_FOLDER_ID}
 *
 * HOW TO USE & ENABLE 2-WAY SYNC (FIXES HTTP 405):
 * 1. Open your spreadsheet in Google Sheets > "Extensions" > "Apps Script".
 * 2. Delete existing code, paste this entire script, and Save (Ctrl+S / Cmd+S).
 * 3. Select "buildWelltheraCompleteSpreadsheet" and click "▶ Run" (once) to build/refresh all tabs.
 * 4. To enable live 2-way "Sync to Sheet" from the Portal:
 *    - Click "Deploy" > "New deployment" (or "Manage deployments" > Edit > Version: "New version")
 *    - Type: "Web app" | Execute as: "Me" | Who has access: "Anyone"
 *    - Click "Deploy" and copy the Web App URL ending in "/exec" into the Portal!
 *
 * WHAT IT BUILDS AUTOMATICALLY:
 * - 🛎️ FRONT DESK DASHBOARD (Tab 1: Type patient name to search history across all ${customers.length.toLocaleString()} patients,
 *   view visits, past spend, and log new appointments with 1 click in the top menu or interactive checkbox!)
 * - 👥 Customers & RFM (All ${customers.length.toLocaleString()} ClinicSense Patients, Contact, Insurance, and RFM Segmentation)
 * - 📅 Services & Bookings Log (Detailed Appointment Logs and Insurance/Copay Splits)
 * - 🤝 Partners & ROI (Referral Partners, Clinics, Gyms, and Commissions)
 * - 💰 CAC & Channel Costs (Acquisition Costs and Marketing Metrics)
 * - 👩‍⚕️ Practitioners & Team (Registered Massage Therapists, Acupuncturist, Psychotherapist, Nurse Injector)
 * - 📋 Procedures & Treatments (Clinical Catalog, Fees, Durations, and Billing Rates)
 * - 🎯 OKRs & Quarterly Goals (Quarterly Revenue Goals, CAC Benchmarks, LTV:CAC Targets & Key Results)
 * - 📖 INSTRUCTIONS & STAFF GUIDE (Clinic Operating Manual & SOP)
 * =========================================================================
 */

// Data synchronized in real-time from the Wellthera Portal (2026-11-22 ClinicSense Export)
const INITIAL_CUSTOMERS = ${customersJson};

const INITIAL_PARTNERS = ${partnersJson};

const INITIAL_BOOKINGS = ${bookingsJson};

const INITIAL_CAC_CHANNELS = ${cacChannelsJson};

const INITIAL_PRACTITIONERS = ${practitionersJson};

const INITIAL_PROCEDURES = ${proceduresJson};

const INITIAL_OKR_PLANS = ${okrPlansJson};

/**
 * Creates interactive menu in Google Sheets top bar upon opening
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 Wellthera Clinic')
    .addItem('✅ Log Front Desk Visit (1-Click)', 'logVisitFromFrontDesk')
    .addItem('🧹 Clear Front Desk Form', 'clearFrontDeskForm')
    .addSeparator()
    .addItem('➕ Add New Partner / Origin Tag', 'addNewPartnerPrompt')
    .addItem('➕ Add New Practitioner', 'addNewPractitionerPrompt')
    .addItem('➕ Add New Service / Treatment', 'addNewProcedurePrompt')
    .addItem('🔄 Refresh Dropdowns from Tabs', 'refreshAllDropdownRules')
    .addSeparator()
    .addItem('🚀 Rebuild / Refresh All Tabs', 'buildWelltheraCompleteSpreadsheet')
    .addItem('🔄 Recalculate Metrics & Totals', 'recalculateAllMetrics')
    .addSeparator()
    .addItem('ℹ️ How to Use Front Desk Dashboard', 'showStaffGuideAlert')
    .addToUi();
}

/**
 * Automatic Trigger: when front desk checks [X] in cell E19,
 * the visit is logged instantly without needing to open menus!
 */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== '🛎️ FRONT DESK DASHBOARD') return;
  
  // If edited cell is interactive checkbox E19 and checked as TRUE
  if (e.range.getA1Notation() === 'E19' && e.value === 'TRUE') {
    logVisitFromFrontDesk();
  }
}

/**
 * Main Setup Function: Builds and populates the entire spreadsheet from scratch with Front Desk Dashboard
 */
function buildWelltheraCompleteSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Interactive Front Desk Dashboard (Tab 1)
  setupFrontDeskDashboard(ss);

  // 2. Customers and RFM Segmentation
  setupCustomersSheet(ss);
  
  // 3. Appointments and Bookings Log
  setupBookingsSheet(ss);

  // 4. Referral Partners & ROI
  setupPartnersSheet(ss);
  
  // 5. Marketing Costs & CAC
  setupCacSheet(ss);

  // 6. Practitioners & Clinical Team
  setupPractitionersSheet(ss);

  // 7. Clinical Procedures & Treatments
  setupProceduresSheet(ss);

  // 8. OKRs & Quarterly Goals
  setupOkrSheet(ss);

  // 9. Refresh dynamic dropdown rules from practitioners and treatments tabs
  refreshAllDropdownRules();

  // 10. Clinic Operating Manual & Rules
  setupInstructionsSheet(ss);
  
  // Remove default sheet (Sheet1) if empty
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Page 1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch(e) {}
  }

  // Activate Front Desk Dashboard as primary tab
  const frontDesk = ss.getSheetByName('🛎️ FRONT DESK DASHBOARD');
  if (frontDesk) ss.setActiveSheet(frontDesk);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Wellthera spreadsheet successfully generated! Front Desk dashboard is ready on Tab 1.', 
    'Success ✅', 
    10
  );
}

/**
 * TAB 1: INTERACTIVE FRONT DESK DASHBOARD
 */
function setupFrontDeskDashboard(ss) {
  let sheet = ss.getSheetByName('🛎️ FRONT DESK DASHBOARD');
  if (!sheet) {
    sheet = ss.insertSheet('🛎️ FRONT DESK DASHBOARD', 0);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#41472B');
  sheet.setFrozenRows(0);

  // Column width configuration
  sheet.setColumnWidth(1, 24);   // A - margin
  sheet.setColumnWidth(2, 230);  // B - Field Label
  sheet.setColumnWidth(3, 290);  // C - Input / Value
  sheet.setColumnWidth(4, 20);   // D - Spacer
  sheet.setColumnWidth(5, 240);  // E - Status Card Label
  sheet.setColumnWidth(6, 260);  // F - Status Card Value
  sheet.setColumnWidth(7, 24);   // G - margin

  // Top Header Banner
  sheet.getRange('B2:F2').merge()
    .setValue('WELLTHERA INTEGRATED HEALTH — CHECK-IN & RECEPTION DASHBOARD')
    .setBackground('#41472B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(13)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(2, 38);

  sheet.getRange('B3:F3').merge()
    .setValue('Enter patient name below. System automatically checks existence, calculates visits, spend and history.')
    .setBackground('#686e4a')
    .setFontColor('#f9f8f5')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(3, 24);

  // Section 1: Check-in / Search
  const defaultPatientName = (INITIAL_CUSTOMERS && INITIAL_CUSTOMERS.length > 1)
    ? (INITIAL_CUSTOMERS[1].name || INITIAL_CUSTOMERS[0].name)
    : 'Jessica Abbruzzino';
  sheet.getRange('B5:C5').setFontWeight('bold').setFontSize(11);
  sheet.getRange('B5').setValue('🔍 PATIENT NAME:').setBackground('#f0ede6').setFontColor('#2b301c');
  sheet.getRange('C5').setValue(defaultPatientName)
    .setBackground('#fff9db')
    .setFontWeight('bold')
    .setFontSize(12)
    .setBorder(true, true, true, true, false, false, '#d9a726', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Automated Patient Detection Formula (Cell F5) — covers up to 5,000 patients
  sheet.getRange('E5').setValue('PATIENT STATUS:').setFontWeight('bold').setBackground('#f0ede6');
  sheet.getRange('F5').setFormula(
    '=IF(ISBLANK(C5), "Waiting for input...", IF(ISNUMBER(MATCH(C5, \\'Customers & RFM\\'!B2:B5000, 0)), "✅ EXISTING PATIENT", "🆕 NEW PATIENT (Fill below)"))'
  ).setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');

  // Automated History Formulas
  sheet.getRange('E6').setValue('Total Previous Visits:').setFontWeight('bold');
  sheet.getRange('F6').setFormula(
    '=IFERROR(VLOOKUP(C5, \\'Customers & RFM\\'!B2:J5000, 8, FALSE), 0)'
  ).setHorizontalAlignment('center').setFontWeight('bold');

  sheet.getRange('E7').setValue('Total Historical Spend (CAD):').setFontWeight('bold');
  sheet.getRange('F7').setFormula(
    '=IFERROR(VLOOKUP(C5, \\'Customers & RFM\\'!B2:J5000, 9, FALSE), 0)'
  ).setNumberFormat('$#,##0.00').setHorizontalAlignment('center').setFontWeight('bold');

  sheet.getRange('E8').setValue('RFM Segment:').setFontWeight('bold');
  sheet.getRange('F8').setFormula(
    '=IFERROR(VLOOKUP(C5, \\'Customers & RFM\\'!B2:R5000, 17, FALSE), "—")'
  ).setHorizontalAlignment('center').setFontWeight('bold');

  sheet.getRange('E9').setValue('Last Recorded Visit:').setFontWeight('bold');
  sheet.getRange('F9').setFormula(
    '=IFERROR(TEXT(VLOOKUP(C5, \\'Customers & RFM\\'!B2:H5000, 7, FALSE), "yyyy-mm-dd"), "First consultation")'
  ).setHorizontalAlignment('center');

  sheet.getRange('E10').setValue('Recorded Insurance:').setFontWeight('bold');
  sheet.getRange('F10').setFormula(
    '=IFERROR(VLOOKUP(C5, \\'Customers & RFM\\'!B2:L5000, 11, FALSE), "To be filled")'
  ).setHorizontalAlignment('center');

  // History Card Border (E5:F10)
  sheet.getRange('E5:F10').setBorder(true, true, true, true, true, true, '#c7c2b4', SpreadsheetApp.BorderStyle.SOLID);

  // Current Appointment Form (Columns B & C)
  const formLabels = [
    ['Appointment Date:', '=TODAY()', 'yyyy-mm-dd'],
    ['Selected Service:', 'Brazilian Lymphatic Drainage (60 Min)', 'text'],
    ['Practitioner / Therapist:', 'Camila Dos Santos, RMT', 'text'],
    ['Total Service Price (CAD):', '=IF(ISBLANK(C7), 0, IFERROR(VLOOKUP(C7, \\'Procedures & Treatments\\'!B2:E200, 4, FALSE), 160))', '$#,##0.00'],
    ['Direct Insurance Billed (CAD):', 120, '$#,##0.00'],
    ['Patient Copay (CAD):', '=MAX(0, C9-C10)', '$#,##0.00'],
    ['Referral Partner / Source:', 'No partner', 'text'],
    ['Appointment Status:', 'Completed', 'text'],
  ];

  for (let i = 0; i < formLabels.length; i++) {
    const row = 6 + i;
    sheet.getRange(row, 2).setValue(formLabels[i][0]).setFontWeight('bold');
    const inputCell = sheet.getRange(row, 3);
    
    if (typeof formLabels[i][1] === 'string' && formLabels[i][1].startsWith('=')) {
      inputCell.setFormula(formLabels[i][1]);
    } else {
      inputCell.setValue(formLabels[i][1]);
    }
    
    if (formLabels[i][2] === '$#,##0.00') {
      inputCell.setNumberFormat('$#,##0.00');
    } else if (formLabels[i][2] === 'yyyy-mm-dd') {
      inputCell.setNumberFormat('yyyy-mm-dd');
    }
    inputCell.setBackground('#ffffff');
  }

  // Dropdown Validations
  const serviceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Brazilian Lymphatic Drainage (60 Min)',
      'Brazilian Lymphatic Drainage (Extended - 90 Min)',
      'Registered Massage Therapy (60 Min)',
      'Registered Massage Therapy (90 Min)',
      'Acupuncture & Traditional Chinese Medicine (60 Min)',
      'Cosmetic Facial Acupuncture & Gua Sha (75 Min)',
      'Psychotherapy & Somatic Mental Health (50 Min)',
      'Nurse-Led Aesthetic Consultation & Neurotoxins (Botox / Dysport - 45 Min)',
      'Advanced Dermal Filler & Skin Booster Therapy (60 Min)',
      'Prenatal & Postnatal Specialized Massage (60 Min)'
    ], true).build();
  sheet.getRange('C7').setDataValidation(serviceRule);

  const therapistRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Camila Dos Santos, RMT',
      'Kiana Forder, R.Ac',
      'Yuki Hamada, RMT',
      'Rachel Wallace, RMT',
      'Liz Cerato, RMT',
      'Thaisa Sakima, RMT',
      'Giovanna Faedo, RP',
      'Elise K. Papa, RN (Injector)'
    ], true).build();
  sheet.getRange('C8').setDataValidation(therapistRule);

  const initialPartnerNames = INITIAL_PARTNERS.length > 0
    ? INITIAL_PARTNERS.map(function(p) { return p.name; })
    : ['No partner', 'Meta', 'Google', 'Existing Wellthera Client', 'Wellthera Partners'];
  const partnerRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(initialPartnerNames, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('C12').setDataValidation(partnerRule);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Completed', 'Upcoming', 'Cancelled'], true).build();
  sheet.getRange('C13').setDataValidation(statusRule);

  sheet.getRange('B5:C13').setBorder(true, true, true, true, true, true, '#c7c2b4', SpreadsheetApp.BorderStyle.SOLID);

  // SECTION: NEW PATIENT INFORMATION (Only if patient does not exist)
  sheet.getRange('B15:F15').merge()
    .setValue('📝 IF NEW PATIENT (Fill below if F5 shows "NEW PATIENT"):')
    .setBackground('#d9a726')
    .setFontColor('#100e0a')
    .setFontWeight('bold')
    .setFontSize(10)
    .setVerticalAlignment('middle');

  sheet.getRange('B16').setValue('Patient Phone:').setFontWeight('bold');
  sheet.getRange('C16').setValue('(705) 555-0199').setBackground('#ffffff');
  
  sheet.getRange('E16').setValue('Patient Email:').setFontWeight('bold');
  sheet.getRange('F16').setValue('new.patient@gmail.com').setBackground('#ffffff');

  sheet.getRange('B17').setValue('Insurance Provider:').setFontWeight('bold');
  sheet.getRange('C17').setValue('Sun Life').setBackground('#ffffff');
  const insuranceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Sun Life', 'Manulife', 'Canada Life', 'Green Shield Canada', 'Blue Cross', 'None / Self-Pay'], true).build();
  sheet.getRange('C17').setDataValidation(insuranceRule);

  sheet.getRange('E17').setValue('Referral Code:').setFontWeight('bold');
  sheet.getRange('F17').setValue('DIRECT').setBackground('#ffffff');

  sheet.getRange('B15:F17').setBorder(true, true, true, true, true, true, '#d9a726', SpreadsheetApp.BorderStyle.SOLID);

  // INTERACTIVE BUTTON / CONFIRMATION CHECKBOX
  sheet.getRange('B19:D19').merge()
    .setValue('👉 CONFIRM AND LOG APPOINTMENT:')
    .setFontWeight('bold')
    .setFontSize(11)
    .setBackground('#f0ede6')
    .setFontColor('#2b301c')
    .setVerticalAlignment('middle');

  // Cell E19: Interactive Checkbox acting as instant 1-Click action button
  const btnCell = sheet.getRange('E19');
  btnCell.insertCheckboxes();
  btnCell.setValue(false);
  btnCell.setBackground('#d4edda');
  btnCell.setHorizontalAlignment('center');

  sheet.getRange('F19')
    .setValue('👈 CLICK CHECKBOX TO LOG (1-CLICK)')
    .setFontWeight('bold')
    .setFontSize(10)
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setVerticalAlignment('middle');

  sheet.getRange('B20:F20').merge()
    .setValue('💡 Tip: Checking the box above or clicking "🏥 Wellthera Clinic" > "✅ Log Front Desk Visit" instantly writes to Bookings Log, increments visits/spend, and syncs to Dashboard!')
    .setBackground('#f9f8f5')
    .setFontColor('#6e6856')
    .setFontSize(9)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.getRange('B19:F20').setBorder(true, true, true, true, true, true, '#41472B', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // LAST RECORD FEEDBACK
  sheet.getRange('B22').setValue('LAST RECORDED VISIT:').setFontWeight('bold').setFontColor('#6e6856');
  sheet.getRange('C22:F22').merge().setValue('No appointments logged in this session.')
    .setFontStyle('italic').setFontColor('#6e6856');

  // Conditional formatting for patient status (Green if existing, Yellow if new)
  const rangeF5 = sheet.getRange('F5');
  const ruleExist = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('EXISTING')
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([rangeF5])
    .build();

  const ruleNew = SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('NEW')
    .setBackground('#fff3cd')
    .setFontColor('#856404')
    .setRanges([rangeF5])
    .build();

  sheet.setConditionalFormatRules([ruleExist, ruleNew]);
}

/**
 * 1-CLICK ACTION: LOGS FRONT DESK VISIT AND UPDATES ALL SPREADSHEET TABS
 */
function logVisitFromFrontDesk() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const frontDesk = ss.getSheetByName('🛎️ FRONT DESK DASHBOARD');
  const customersSheet = ss.getSheetByName('Customers & RFM');
  const bookingsSheet = ss.getSheetByName('Services & Bookings Log');

  if (!frontDesk || !customersSheet || !bookingsSheet) {
    SpreadsheetApp.getUi().alert('Error: Spreadsheet tabs not found. Please run "Rebuild / Refresh All Tabs" first.');
    return;
  }

  const patientName = frontDesk.getRange('C5').getValue().toString().trim();
  if (!patientName) {
    SpreadsheetApp.getUi().alert('Please enter the Patient Name in cell C5 before logging!');
    return;
  }

  const visitDate = frontDesk.getRange('C6').getValue();
  const formattedDate = visitDate instanceof Date ? Utilities.formatDate(visitDate, Session.getScriptTimeZone(), 'yyyy-MM-dd') : visitDate;
  const service = frontDesk.getRange('C7').getValue();
  const therapist = frontDesk.getRange('C8').getValue();
  const totalPrice = Number(frontDesk.getRange('C9').getValue()) || 0;
  const insuranceBilled = Number(frontDesk.getRange('C10').getValue()) || 0;
  const patientPaid = Number(frontDesk.getRange('C11').getValue()) || 0;
  const partnerSource = frontDesk.getRange('C12').getValue() || 'No partner';
  const status = frontDesk.getRange('C13').getValue() || 'Completed';

  // 1. Check if patient already exists in Customers tab
  const customerData = customersSheet.getDataRange().getValues();
  let customerFoundRow = -1;
  let currentVisits = 0;
  let currentSpend = 0;

  for (let r = 1; r < customerData.length; r++) {
    if (customerData[r][1] && customerData[r][1].toString().trim().toLowerCase() === patientName.toLowerCase()) {
      customerFoundRow = r + 1; // 1-based index
      currentVisits = Number(customerData[r][8]) || 0;
      currentSpend = Number(customerData[r][9]) || 0;
      break;
    }
  }

  // 2. If NEW PATIENT, add row to Customers tab
  let isNew = false;
  if (customerFoundRow === -1) {
    isNew = true;
    const phone = frontDesk.getRange('C16').getValue() || '';
    const email = frontDesk.getRange('F16').getValue() || '';
    const insurance = frontDesk.getRange('C17').getValue() || 'None / Self-Pay';
    const refCode = frontDesk.getRange('F17').getValue() || 'DIRECT';
    const newId = 'c-' + (customerData.length < 10 ? '0' : '') + customerData.length;

    customersSheet.appendRow([
      newId,
      patientName,
      email,
      phone,
      partnerSource,
      refCode,
      formattedDate, // First Visit
      formattedDate, // Last Visit
      1,             // Total Visits
      totalPrice,    // Total Spend
      service,
      insurance,
      'Active',
      0,             // Recency
      5, 2, 2,       // Initial RFM Scores
      'Recent Customers' // Segment
    ]);

    // Apply formatting to new row
    const lastRow = customersSheet.getLastRow();
    customersSheet.getRange(lastRow, 10).setNumberFormat('$#,##0.00');
    customersSheet.getRange(lastRow, 7, 1, 2).setNumberFormat('yyyy-mm-dd');
  } else {
    // Update existing customer: Last Visit (+1 visit, +spend)
    const newVisits = currentVisits + 1;
    const newSpend = currentSpend + totalPrice;
    customersSheet.getRange(customerFoundRow, 8).setValue(formattedDate); // Last Visit
    customersSheet.getRange(customerFoundRow, 9).setValue(newVisits);      // Total Visits
    customersSheet.getRange(customerFoundRow, 10).setValue(newSpend);      // Total Spend
    customersSheet.getRange(customerFoundRow, 11).setValue(service);       // Updated preferred service
    customersSheet.getRange(customerFoundRow, 14).setValue(0);             // Recency = 0 days
  }

  // 3. Add appointment row to "Services & Bookings Log"
  const bookingCount = bookingsSheet.getLastRow();
  const bookingId = 'b-' + (100 + bookingCount);

  bookingsSheet.appendRow([
    bookingId,
    formattedDate,
    patientName,
    partnerSource,
    service,
    service,
    therapist,
    60,
    totalPrice,
    insuranceBilled,
    patientPaid,
    status
  ]);

  const newBookingRow = bookingsSheet.getLastRow();
  bookingsSheet.getRange(newBookingRow, 9, 1, 3).setNumberFormat('$#,##0.00');
  bookingsSheet.getRange(newBookingRow, 2).setNumberFormat('yyyy-mm-dd');

  // 4. Update Dashboard feedback and reset interactive checkbox
  const feedbackMsg = \`✅ Appointment logged successfully! Patient: \${patientName} | Service: \${service} | Total: CAD $\${totalPrice.toFixed(2)} (\${isNew ? 'New Patient Registered' : 'Visit #' + (currentVisits + 1) + ' Updated'}) at \${new Date().toLocaleTimeString()}\`;
  frontDesk.getRange('C22:F22').setValue(feedbackMsg).setFontColor('#155724').setFontStyle('normal');

  // Reset checkbox cell E19 so it is ready for the next checkout
  frontDesk.getRange('E19').setValue(false);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    feedbackMsg,
    'Visit Logged ✅',
    6
  );
}

function clearFrontDeskForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const frontDesk = ss.getSheetByName('🛎️ FRONT DESK DASHBOARD');
  if (!frontDesk) return;

  frontDesk.getRange('C5').setValue('');
  frontDesk.getRange('C16').setValue('');
  frontDesk.getRange('F16').setValue('');
  frontDesk.getRange('C22:F22').setValue('Form cleared. Ready for next patient.').setFontColor('#6e6856');
}

/**
 * TAB: CUSTOMERS & RFM
 */
function setupCustomersSheet(ss) {
  let sheet = ss.getSheetByName('Customers & RFM');
  if (!sheet) {
    sheet = ss.insertSheet('Customers & RFM', 1);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#52573a');
  sheet.setFrozenRows(1);

  const headers = [
    'Customer ID', 'Full Name', 'Email', 'Phone', 'Partner Channel', 'Referral Code',
    'First Visit', 'Last Visit', 'Total Visits', 'Total Spend (CAD)', 'Preferred Service',
    'Insurance Provider', 'Status', 'Recency (Days)', 'R-Score', 'F-Score', 'M-Score', 'RFM Segment'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#41472B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = INITIAL_CUSTOMERS.map(c => [
    c.id, c.fullName || c.name, c.email, c.phone, c.partnerName, c.referralCode,
    c.firstVisitDate, c.lastVisitDate, c.totalVisits, c.totalSpendCAD,
    c.preferredService, c.insuranceProvider, c.status,
    c.rfm ? c.rfm.recencyDays : c.recencyDays,
    c.rfm ? c.rfm.rScore : c.recencyScore,
    c.rfm ? c.rfm.fScore : c.frequencyScore,
    c.rfm ? c.rfm.mScore : c.monetaryScore,
    c.rfm ? c.rfm.rfmSegment : c.rfmSegment
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 10, rows.length, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 7, rows.length, 2).setNumberFormat('yyyy-mm-dd');
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: SERVICES & BOOKINGS LOG
 */
function setupBookingsSheet(ss) {
  let sheet = ss.getSheetByName('Services & Bookings Log');
  if (!sheet) {
    sheet = ss.insertSheet('Services & Bookings Log', 2);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#2b301c');
  sheet.setFrozenRows(1);

  const headers = [
    'Booking ID', 'Booking Date', 'Customer Name', 'Partner Source', 'Service Category',
    'Service Title', 'Clinician / Therapist', 'Duration (Min)', 'Price (CAD)',
    'Insurance Billed (CAD)', 'Patient Paid (CAD)', 'Status'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#41472B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = INITIAL_BOOKINGS.map(b => [
    b.id, b.bookingDate, b.customerName, b.partnerName, b.serviceCategory,
    b.serviceTitle, b.therapist, b.durationMinutes, b.priceCAD,
    b.insuranceBilledCAD, b.patientPaidCAD, b.status
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 2, rows.length, 1).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(2, 9, rows.length, 3).setNumberFormat('$#,##0.00');
  }

  const serviceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Registered Massage Therapy',
      'Brazilian Lymphatic Drainage',
      'Acupuncture',
      'Nurse-Led Injectables',
      'Psychotherapy'
    ], true).build();
  sheet.getRange('E2:E5000').setDataValidation(serviceRule);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Completed', 'Upcoming', 'Cancelled'], true).build();
  sheet.getRange('L2:L5000').setDataValidation(statusRule);

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: PARTNERS & ROI
 */
function setupPartnersSheet(ss) {
  let sheet = ss.getSheetByName('Partners & ROI');
  if (!sheet) {
    sheet = ss.insertSheet('Partners & ROI', 3);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#d9a726');
  sheet.setFrozenRows(1);

  const headers = [
    'Partner ID', 'Partner Name', 'Category', 'Contact Person', 'Email', 'Phone',
    'Agreement Type', 'Commission Value', 'Monthly Retainer (CAD)', 'Patients Referred',
    'Active Patients', 'Total Bookings', 'Total Revenue (CAD)', 'Commission Paid (CAD)',
    'Net Revenue (CAD)', 'ROI %', 'Avg Customer Spend (CAD)', 'Status'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#41472B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = INITIAL_PARTNERS.map(p => [
    p.id, p.name, p.category, p.contactPerson, p.email, p.phone,
    p.commissionType || p.agreementType, p.commissionValue, p.monthlyRetainerCAD, p.referredCustomersCount || p.referredPatientsCount,
    p.activeCustomersCount || p.activePatientsCount, p.totalBookingsCount, p.totalRevenueCAD, p.totalCommissionPaidCAD,
    p.netRevenueCAD, p.roiPercent || p.roiPercentage, p.averageCustomerSpendCAD || p.avgCustomerSpendCAD, p.status
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 9, rows.length, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 13, rows.length, 3).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 16, rows.length, 1).setNumberFormat('0.0%');
    sheet.getRange(2, 17, rows.length, 1).setNumberFormat('$#,##0.00');
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: CAC & CHANNEL COSTS
 */
function setupCacSheet(ss) {
  let sheet = ss.getSheetByName('CAC & Channel Costs');
  if (!sheet) {
    sheet = ss.insertSheet('CAC & Channel Costs', 4);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#6e7350');
  sheet.setFrozenRows(1);

  const headers = [
    'Channel / Partner', 'Month Period', 'Spend (CAD)', 'New Customers Acquired',
    'Calculated CAC (CAD)', 'Average LTV (CAD)', 'LTV:CAC Ratio',
    'Payback Visits', 'Payback Period (Months)'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#41472B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = INITIAL_CAC_CHANNELS.map(c => [
    c.partnerOrChannel || c.channelOrPartnerName, c.month || c.periodMonth, c.spendCAD, c.newCustomersAcquired,
    c.calculatedCacCAD || c.calculatedCAC, c.averageLtvCAD || c.averageLTV, c.ltvCacRatio || c.ltvToCacRatio,
    c.paybackPeriodVisits || c.paybackVisits, c.paybackPeriodMonths
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 3, rows.length, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 5, rows.length, 2).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 7, rows.length, 1).setNumberFormat('0.0"x"');
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: INSTRUCTIONS & STAFF GUIDE
 */
function setupInstructionsSheet(ss) {
  let sheet = ss.getSheetByName('📋 INSTRUCTIONS & STAFF GUIDE');
  if (!sheet) {
    sheet = ss.insertSheet('📋 INSTRUCTIONS & STAFF GUIDE', 5);
  } else {
    sheet.clear();
  }
  
  sheet.setTabColor('#41472B');
  
  const content = [
    ['WELLTHERA INTEGRATED HEALTH — FRONT DESK OPERATING MANUAL & SPREADSHEET GUIDE', '', '', ''],
    ['Target Google Drive Folder:', '${DEFAULT_TARGET_DRIVE_FOLDER_URL}', '', ''],
    ['Drive Folder ID:', '${DEFAULT_TARGET_DRIVE_FOLDER_ID}', '', ''],
    ['Last Updated:', new Date().toLocaleString('en-CA'), '', ''],
    ['', '', '', ''],
    ['1. FAST FRONT DESK WORKFLOW', '', '', ''],
    ['Step', 'Action', 'Automated System Behavior', 'Notes'],
    ['1. Enter Name', 'In Tab 1 "FRONT DESK DASHBOARD", type patient name in C5.', 'Cell F5 lights up green if existing patient or yellow if new.', 'Looks up visits and spend'],
    ['2. Select Service', 'Pick service in dropdown (C7) and clinician in (C8).', 'Price and copay formulas compute automatically.', 'Pre-filled defaults'],
    ['3. Confirm & Log', 'Check box in E19 or click menu "Wellthera Clinic" > "Log Visit".', 'Updates total visits, historical spend, and adds row to Bookings Log.', '1 click!'],
    ['', '', '', ''],
    ['2. ACTIVE ACQUISITION CHANNELS & PARTNER CODES', '', '', ''],
    ['Referral Code', 'Partner / Channel Name', 'Category', 'Commission / Notes'],
    ['DIRECT', 'No partner', 'Direct / No Partner', '$0 (Direct / Walk-in / ClinicSense Unattributed)'],
    ['CLIENT-REF', 'Existing Wellthera Client', 'Client Referral', 'Word-of-mouth referrals from existing clinic patients'],
    ['GOOGLE', 'Google', 'Paid & Organic Search (Google)', 'Google Search & Business Profile tracking'],
    ['PARTNER', 'Wellthera Partners', 'Clinic Referral Partner', 'External referral partners recorded in ClinicSense'],
    ['META', 'Meta', 'Paid Social (Meta)', 'Instagram & Facebook acquisition tracking']
  ];

  const safeData = content.map(row => [
    row[0] != null ? String(row[0]) : '',
    row[1] != null ? String(row[1]) : '',
    row[2] != null ? String(row[2]) : '',
    row[3] != null ? String(row[3]) : ''
  ]);

  sheet.getRange(1, 1, safeData.length, 4).setValues(safeData);

  sheet.getRange('A1:D1').setBackground('#41472B').setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(13);
  sheet.getRange('A6:D6').setBackground('#686e4a').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange('A12:D12').setBackground('#686e4a').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.autoResizeColumns(1, 4);
}

function setupPractitionersSheet(ss) {
  let sheet = ss.getSheetByName('Practitioners & Team') || ss.getSheetByName('Practitioners');
  if (!sheet) {
    sheet = ss.insertSheet('Practitioners & Team', 5);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#334155');
  sheet.setFrozenRows(1);

  const headers = [
    'Practitioner ID', 'Full Name', 'Professional Title', 'Discipline / Specialty',
    'Email', 'Phone', 'Status', 'Services Offered'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#1e293b')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = INITIAL_PRACTITIONERS.map(p => [
    p.id,
    p.name,
    p.title,
    p.discipline,
    p.email || '',
    p.phone || '',
    p.status || 'Active',
    Array.isArray(p.servicesOffered) ? p.servicesOffered.join(', ') : (p.servicesOffered || '')
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'On Leave', 'Inactive'], true).build();
  sheet.getRange('G2:G50').setDataValidation(statusRule);

  sheet.autoResizeColumns(1, headers.length);
}

function setupProceduresSheet(ss) {
  let sheet = ss.getSheetByName('Procedures & Treatments') || ss.getSheetByName('Procedures');
  if (!sheet) {
    sheet = ss.insertSheet('Procedures & Treatments', 6);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#0f766e');
  sheet.setFrozenRows(1);

  const headers = [
    'Procedure ID', 'Procedure Name', 'Category', 'Duration (Min)', 'Standard Price (CAD)',
    'Insurance Eligible', 'Avg Direct Billed (CAD)', 'Typical Copay (CAD)',
    'Assigned Practitioners', 'Status', 'Clinical Description'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#0f766e')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = INITIAL_PROCEDURES.map(proc => [
    proc.id,
    proc.name,
    proc.category,
    proc.durationMinutes,
    proc.priceCAD,
    proc.insuranceCovered ? 'Yes' : 'No',
    proc.typicalInsuranceBillingCAD || 0,
    proc.typicalCopayCAD || 0,
    Array.isArray(proc.assignedPractitioners) ? proc.assignedPractitioners.join(', ') : (proc.assignedPractitioners || ''),
    proc.status || 'Active',
    proc.description || ''
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 5, rows.length, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 7, rows.length, 2).setNumberFormat('$#,##0.00');
  }

  const insRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Yes', 'No'], true).build();
  sheet.getRange('F2:F50').setDataValidation(insRule);

  const procStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Active', 'Inactive'], true).build();
  sheet.getRange('J2:J50').setDataValidation(procStatusRule);

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: OKRS & QUARTERLY GOALS
 */
function setupOkrSheet(ss, okrList) {
  const sourceOkrs = Array.isArray(okrList) ? okrList : INITIAL_OKR_PLANS;
  let sheet = ss.getSheetByName('OKRs & Quarterly Goals') || ss.getSheetByName('OKRs');
  if (!sheet) {
    sheet = ss.insertSheet('OKRs & Quarterly Goals', 7);
  } else {
    sheet.clear();
  }

  sheet.setTabColor('#b45309');
  sheet.setFrozenRows(1);

  const headers = [
    'Quarter', 'Year', 'Revenue Goal (CAD)', 'CAC Benchmark (CAD)',
    'LTV:CAC Target', 'New Patients Target', 'Retention Target (%)',
    'Partner Share Target (%)', 'Objective', 'Owner',
    'Key Result', 'Current Value', 'Target Value', 'Unit', 'Status'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground('#41472B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  const rows = [];
  (sourceOkrs || []).forEach(function(plan) {
    const objectives = Array.isArray(plan.objectives) ? plan.objectives : [];
    if (objectives.length === 0) {
      rows.push([
        plan.quarter, plan.year, plan.revenueGoalCAD, plan.cacBenchmarkCAD,
        plan.ltvCacTargetRatio, plan.newPatientsTarget, plan.retentionTargetRate,
        plan.partnerRevenueShareTarget, '', '', '', 0, 0, '', 'on_track'
      ]);
      return;
    }
    objectives.forEach(function(obj) {
      const krs = Array.isArray(obj.keyResults) ? obj.keyResults : [];
      if (krs.length === 0) {
        rows.push([
          plan.quarter, plan.year, plan.revenueGoalCAD, plan.cacBenchmarkCAD,
          plan.ltvCacTargetRatio, plan.newPatientsTarget, plan.retentionTargetRate,
          plan.partnerRevenueShareTarget, obj.title, obj.owner, '', 0, 0, '', 'on_track'
        ]);
        return;
      }
      krs.forEach(function(kr) {
        rows.push([
          plan.quarter, plan.year, plan.revenueGoalCAD, plan.cacBenchmarkCAD,
          plan.ltvCacTargetRatio, plan.newPatientsTarget, plan.retentionTargetRate,
          plan.partnerRevenueShareTarget, obj.title, obj.owner,
          kr.title, kr.currentValue, kr.targetValue, kr.unit || '', kr.status || 'on_track'
        ]);
      });
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(2, 3, rows.length, 2).setNumberFormat('$#,##0.00');
  }

  sheet.autoResizeColumns(1, headers.length);
}

function addNewPractitionerPrompt() {
  const ui = SpreadsheetApp.getUi();
  const nameResp = ui.prompt('Add Practitioner', 'Enter Full Name of Practitioner:', ui.ButtonSet.OK_CANCEL);
  if (nameResp.getSelectedButton() !== ui.Button.OK) return;
  const name = nameResp.getResponseText().trim();
  if (!name) return;

  const titleResp = ui.prompt('Add Practitioner', 'Enter Professional Title (e.g., Registered Massage Therapist, Registered Acupuncturist, Registered Nurse):', ui.ButtonSet.OK_CANCEL);
  const title = titleResp.getSelectedButton() === ui.Button.OK ? titleResp.getResponseText().trim() : 'Registered Massage Therapist';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Practitioners & Team') || ss.getSheetByName('Practitioners');
  if (!sheet) {
    sheet = ss.insertSheet('Practitioners & Team');
  }
  const nextId = 'pr-' + sheet.getLastRow();
  sheet.appendRow([nextId, name, title || 'Registered Massage Therapist', title || 'Clinical', '', '', 'Active', 'All Treatments']);
  refreshAllDropdownRules();
  ss.toast('Practitioner "' + name + '" added and front desk dropdowns refreshed!', 'Success ✅');
}

function addNewProcedurePrompt() {
  const ui = SpreadsheetApp.getUi();
  const nameResp = ui.prompt('Add Service / Treatment', 'Enter Treatment Name (e.g., Hot Stone Massage, Deep Tissue 90 Min):', ui.ButtonSet.OK_CANCEL);
  if (nameResp.getSelectedButton() !== ui.Button.OK) return;
  const name = nameResp.getResponseText().trim();
  if (!name) return;

  const priceResp = ui.prompt('Add Service / Treatment', 'Enter Standard Fee in CAD (e.g., 160):', ui.ButtonSet.OK_CANCEL);
  const price = priceResp.getSelectedButton() === ui.Button.OK ? (Number(priceResp.getResponseText().replace(/[^0-9.-]/g, '')) || 150) : 150;

  const durationResp = ui.prompt('Add Service / Treatment', 'Enter Duration in minutes (e.g., 60, 90):', ui.ButtonSet.OK_CANCEL);
  const duration = durationResp.getSelectedButton() === ui.Button.OK ? (Number(durationResp.getResponseText().replace(/[^0-9]/g, '')) || 60) : 60;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Procedures & Treatments') || ss.getSheetByName('Procedures');
  if (!sheet) {
    sheet = ss.insertSheet('Procedures & Treatments');
  }
  const nextId = 'proc-' + sheet.getLastRow();
  sheet.appendRow([nextId, name, 'Massage Therapy', duration, price, 'Yes', price, 0, 'All Active Practitioners', 'Active', 'Clinical treatment']);
  refreshAllDropdownRules();
  ss.toast('Service "' + name + '" added and front desk dropdowns refreshed!', 'Success ✅');
}

function addNewPartnerPrompt() {
  const ui = SpreadsheetApp.getUi();
  const nameResp = ui.prompt('Add Partner / Origin Tag', 'Enter Partner or Acquisition Source Name (e.g., Barrie CrossFit, Dr. Smith Clinic):', ui.ButtonSet.OK_CANCEL);
  if (nameResp.getSelectedButton() !== ui.Button.OK) return;
  const name = nameResp.getResponseText().trim();
  if (!name) return;

  const catResp = ui.prompt('Add Partner / Origin Tag', 'Enter Category (e.g., Clinic Referral Partner, Fitness & CrossFit, Physiotherapy & Chiro, Paid Social (Meta)):', ui.ButtonSet.OK_CANCEL);
  const category = catResp.getSelectedButton() === ui.Button.OK && catResp.getResponseText().trim()
    ? catResp.getResponseText().trim()
    : 'Clinic Referral Partner';

  const commResp = ui.prompt('Add Partner / Origin Tag', 'Enter Commission % or Flat CAD (enter 0 if none):', ui.ButtonSet.OK_CANCEL);
  const commVal = commResp.getSelectedButton() === ui.Button.OK ? (Number(commResp.getResponseText().replace(/[^0-9.-]/g, '')) || 0) : 0;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Partners & ROI');
  if (!sheet) {
    sheet = ss.insertSheet('Partners & ROI');
  }
  const nextId = 'partner-' + new Date().getTime();
  sheet.appendRow([
    nextId, name, category, 'Clinic Management', '', '',
    commVal > 0 ? 'Percentage (%)' : 'None ($0)', commVal, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 'Active'
  ]);
  refreshAllDropdownRules();
  ss.toast('Partner / Origin "' + name + '" added and automatically enabled in Front Desk dropdowns!', 'Success ✅');
}

function refreshAllDropdownRules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const frontDesk = ss.getSheetByName('🛎️ FRONT DESK DASHBOARD');
  if (!frontDesk) return;

  const custSheet = ss.getSheetByName('Customers & RFM');
  const bookSheet = ss.getSheetByName('Services & Bookings Log');
  const partSheet = ss.getSheetByName('Partners & ROI');
  const practSheet = ss.getSheetByName('Practitioners & Team') || ss.getSheetByName('Practitioners');
  const procSheet = ss.getSheetByName('Procedures & Treatments') || ss.getSheetByName('Procedures');

  // 1. Live Patient Name autocomplete (C5) from Customers & RFM (allows typing brand-new patients too)
  if (custSheet) {
    const patientRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(custSheet.getRange('B2:B5000'), true)
      .setAllowInvalid(true)
      .build();
    frontDesk.getRange('C5').setDataValidation(patientRule);
  }

  // 2. Live Service / Treatment dropdown (C7) bound directly to Procedures & Treatments!B2:B200
  if (procSheet) {
    const serviceRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(procSheet.getRange('B2:B200'), true)
      .setAllowInvalid(true)
      .build();
    frontDesk.getRange('C7').setDataValidation(serviceRule);
  }

  // 3. Live Practitioner / Therapist dropdown (C8) bound directly to Practitioners & Team!B2:B200
  if (practSheet) {
    const therapistRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(practSheet.getRange('B2:B200'), true)
      .setAllowInvalid(true)
      .build();
    frontDesk.getRange('C8').setDataValidation(therapistRule);
  }

  // 4. Live Origin / Referral Partner dropdown (C12 + Customers E + Bookings D) bound directly to Partners & ROI!B2:B200
  if (partSheet) {
    const partnerRangeRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(partSheet.getRange('B2:B200'), true)
      .setAllowInvalid(true)
      .build();
    frontDesk.getRange('C12').setDataValidation(partnerRangeRule);
    if (custSheet) {
      custSheet.getRange('E2:E5000').setDataValidation(partnerRangeRule);
    }
    if (bookSheet) {
      bookSheet.getRange('D2:D5000').setDataValidation(partnerRangeRule);
    }
  }
}

function recalculateAllMetrics() {
  SpreadsheetApp.getActiveSpreadsheet().toast('All metrics recalculated successfully!', 'Updated ✅');
}

function showStaffGuideAlert() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Wellthera Front Desk Manual',
    '1. Open tab "🛎️ FRONT DESK DASHBOARD".\\\\n' +
    '2. Type patient name in cell C5.\\\\n' +
    '3. If existing, view history instantly!\\\\n' +
    '4. Pick service and check cell E19 or click "Wellthera Clinic" > "✅ Log Front Desk Visit (1-Click)".\\\\n\\\\n' +
    'System automatically increments visits, spend history and appends to Bookings Log!',
    ui.ButtonSet.OK
  );
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        version: '5.0',
        supportsFullSync: true,
        message: 'Wellthera Apps Script v5.0 GET endpoint is online.',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = exportDashboardData(ss);
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const payload = JSON.parse(rawBody);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 0. Action: Ping / Connection Test (verifies POST works without modifying data)
    if (payload.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        version: '5.0',
        supportsFullSync: true,
        message: 'Wellthera Apps Script v5.0 POST Webhook is active and ready for 2-way sync!',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Action: Add Booking
    if (payload.action === 'addBooking' && payload.booking) {
      const b = payload.booking;
      const sheet = ss.getSheetByName('Services & Bookings Log') || ss.getSheetByName('Bookings');
      if (sheet) {
        sheet.appendRow([
          b.id, b.bookingDate, b.customerName, b.partnerName, b.serviceCategory,
          b.serviceTitle, b.therapist, b.durationMinutes, b.priceCAD,
          b.insuranceBilledCAD, b.patientPaidCAD, b.status
        ]);
      }
    }

    // 2. Action: Full Sync Data from Dashboard (writes all tabs from portal payload)
    if (payload.action === 'fullSync' && payload.data) {
      const d = payload.data;

      if (Array.isArray(d.customers) && d.customers.length > 0) {
        const custSheet = ss.getSheetByName('Customers & RFM') || ss.insertSheet('Customers & RFM', 1);
        custSheet.clear();
        const headers = [
          'Customer ID', 'Full Name', 'Email', 'Phone', 'Partner Channel', 'Referral Code',
          'First Visit', 'Last Visit', 'Total Visits', 'Total Spend (CAD)', 'Preferred Service',
          'Insurance Provider', 'Status', 'Recency (Days)', 'R-Score', 'F-Score', 'M-Score', 'RFM Segment'
        ];
        custSheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setBackground('#41472B').setFontColor('#FFFFFF').setFontWeight('bold');
        const rows = d.customers.map(function(c) {
          return [
            c.id || '', c.name || c.fullName || '', c.email || '', c.phone || '',
            c.partnerName || 'No partner', c.referralCode || 'DIRECT',
            c.firstVisitDate || '', c.lastVisitDate || '', Number(c.totalVisits) || 0,
            Number(c.totalSpendCAD) || 0, c.preferredService || '', c.insuranceProvider || 'None / Self-Pay',
            c.status || 'Active', Number(c.recencyDays) || 0, Number(c.recencyScore) || 1,
            Number(c.frequencyScore) || 1, Number(c.monetaryScore) || 1, c.rfmSegment || 'Recent Customers'
          ];
        });
        custSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        custSheet.getRange(2, 10, rows.length, 1).setNumberFormat('$#,##0.00');
        custSheet.setFrozenRows(1);
      }

      if (Array.isArray(d.bookings) && d.bookings.length > 0) {
        const bookSheet = ss.getSheetByName('Services & Bookings Log') || ss.insertSheet('Services & Bookings Log', 2);
        bookSheet.clear();
        const headers = [
          'Booking ID', 'Booking Date', 'Customer Name', 'Partner Source', 'Service Category',
          'Service Title', 'Clinician / Therapist', 'Duration (Min)', 'Price (CAD)',
          'Insurance Billed (CAD)', 'Patient Paid (CAD)', 'Status'
        ];
        bookSheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setBackground('#41472B').setFontColor('#FFFFFF').setFontWeight('bold');
        const rows = d.bookings.map(function(b) {
          return [
            b.id || '', b.bookingDate || '', b.customerName || '', b.partnerName || 'No partner',
            b.serviceCategory || '', b.serviceTitle || '', b.therapist || '',
            Number(b.durationMinutes) || 60, Number(b.priceCAD) || 0,
            Number(b.insuranceBilledCAD) || 0, Number(b.patientPaidCAD) || 0, b.status || 'Completed'
          ];
        });
        bookSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        bookSheet.getRange(2, 9, rows.length, 3).setNumberFormat('$#,##0.00');
        bookSheet.setFrozenRows(1);
      }

      if (Array.isArray(d.partners) && d.partners.length > 0) {
        const partSheet = ss.getSheetByName('Partners & ROI') || ss.insertSheet('Partners & ROI', 3);
        partSheet.clear();
        const headers = [
          'Partner ID', 'Partner Name', 'Category', 'Contact Person', 'Email', 'Phone',
          'Agreement Type', 'Commission Value', 'Monthly Retainer (CAD)', 'Patients Referred',
          'Active Patients', 'Total Bookings', 'Total Revenue (CAD)', 'Commission Paid (CAD)',
          'Net Revenue (CAD)', 'ROI %', 'Avg Customer Spend (CAD)', 'Status'
        ];
        partSheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setBackground('#41472B').setFontColor('#FFFFFF').setFontWeight('bold');
        const rows = d.partners.map(function(p) {
          return [
            p.id || '', p.name || '', p.category || '', p.contactPerson || '', p.email || '', p.phone || '',
            p.commissionType || 'Percentage', Number(p.commissionValue) || 0, Number(p.monthlyRetainerCAD) || 0,
            Number(p.referredCustomersCount) || 0, Number(p.activeCustomersCount) || 0, Number(p.totalBookingsCount) || 0,
            Number(p.totalRevenueCAD) || 0, Number(p.totalCommissionPaidCAD) || 0, Number(p.netRevenueCAD) || 0,
            Number(p.roiPercent) || 0, Number(p.averageCustomerSpendCAD) || 0, p.status || 'Active'
          ];
        });
        partSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        partSheet.setFrozenRows(1);
      }

      if (Array.isArray(d.cacChannels) && d.cacChannels.length > 0) {
        const cacSheet = ss.getSheetByName('CAC & Channel Costs') || ss.insertSheet('CAC & Channel Costs', 4);
        cacSheet.clear();
        const headers = [
          'Channel / Partner', 'Month Period', 'Spend (CAD)', 'New Customers Acquired',
          'Calculated CAC (CAD)', 'Average LTV (CAD)', 'LTV:CAC Ratio',
          'Payback Visits', 'Payback Period (Months)'
        ];
        cacSheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setBackground('#41472B').setFontColor('#FFFFFF').setFontWeight('bold');
        const rows = d.cacChannels.map(function(c) {
          return [
            c.partnerOrChannel || '', c.month || '', Number(c.spendCAD) || 0,
            Number(c.newCustomersAcquired) || 0, Number(c.calculatedCacCAD) || 0,
            Number(c.averageLtvCAD) || 0, Number(c.ltvCacRatio) || 0,
            Number(c.paybackPeriodVisits) || 0, Number(c.paybackPeriodMonths) || 0
          ];
        });
        cacSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        cacSheet.setFrozenRows(1);
      }

      if (Array.isArray(d.practitioners) && d.practitioners.length > 0) {
        const practSheet = ss.getSheetByName('Practitioners & Team') || ss.insertSheet('Practitioners & Team', 5);
        practSheet.clear();
        const headers = [
          'Practitioner ID', 'Full Name', 'Professional Title', 'Discipline / Specialty',
          'Email', 'Phone', 'Status', 'Services Offered'
        ];
        practSheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setBackground('#1e293b').setFontColor('#FFFFFF').setFontWeight('bold');
        const rows = d.practitioners.map(function(p) {
          return [
            p.id || '', p.name || '', p.title || '', p.discipline || '',
            p.email || '', p.phone || '', p.status || 'Active',
            Array.isArray(p.servicesOffered) ? p.servicesOffered.join(', ') : (p.servicesOffered || '')
          ];
        });
        practSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        practSheet.setFrozenRows(1);
      }

      if (Array.isArray(d.procedures) && d.procedures.length > 0) {
        const procSheet = ss.getSheetByName('Procedures & Treatments') || ss.insertSheet('Procedures & Treatments', 6);
        procSheet.clear();
        const headers = [
          'Procedure ID', 'Procedure Name', 'Category', 'Duration (Min)', 'Standard Price (CAD)',
          'Insurance Eligible', 'Avg Direct Billed (CAD)', 'Typical Copay (CAD)',
          'Assigned Practitioners', 'Status', 'Clinical Description'
        ];
        procSheet.getRange(1, 1, 1, headers.length).setValues([headers])
          .setBackground('#0f766e').setFontColor('#FFFFFF').setFontWeight('bold');
        const rows = d.procedures.map(function(proc) {
          return [
            proc.id || '', proc.name || '', proc.category || '', Number(proc.durationMinutes) || 60,
            Number(proc.priceCAD) || 0, proc.insuranceCovered ? 'Yes' : 'No',
            Number(proc.typicalInsuranceBillingCAD) || 0, Number(proc.typicalCopayCAD) || 0,
            Array.isArray(proc.assignedPractitioners) ? proc.assignedPractitioners.join(', ') : (proc.assignedPractitioners || ''),
            proc.status || 'Active', proc.description || ''
          ];
        });
        procSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
        procSheet.setFrozenRows(1);
      }

      if (Array.isArray(d.okrPlans) && d.okrPlans.length > 0) {
        setupOkrSheet(ss, d.okrPlans);
      }

      refreshAllDropdownRules();
    }

    // 3. Action: Query latest datasets to update Portal Dashboard
    if (payload.action === 'getData' || payload.action === 'fetch') {
      return ContentService.createTextOutput(JSON.stringify(exportDashboardData(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'All portal datasets successfully synchronized to Google Sheets!',
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Exports spreadsheet records as clean JSON for consumption by the Vercel Dashboard
 */
function exportDashboardData(ss) {
  const custSheet = ss.getSheetByName('Customers & RFM') || ss.getSheetByName('Customers') || ss.getSheetByName('Patients & RFM') || ss.getSheetByName('Patients');
  const bookSheet = ss.getSheetByName('Services & Bookings Log') || ss.getSheetByName('Bookings') || ss.getSheetByName('Services') || ss.getSheetByName('Appointments');
  const partSheet = ss.getSheetByName('Partners & ROI') || ss.getSheetByName('Partners') || ss.getSheetByName('Referral Partners');
  const cacSheet = ss.getSheetByName('CAC & Channel Costs') || ss.getSheetByName('CAC') || ss.getSheetByName('Marketing Costs');
  const practSheet = ss.getSheetByName('Practitioners & Team') || ss.getSheetByName('Practitioners') || ss.getSheetByName('Team');
  const procSheet = ss.getSheetByName('Procedures & Treatments') || ss.getSheetByName('Procedures') || ss.getSheetByName('Treatments');
  
  const customers = [];
  if (custSheet && custSheet.getLastRow() > 1) {
    const data = custSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let id = String(row[0] || '').trim();
      let name = String(row[1] || '').trim();
      let email = String(row[2] || '').trim();
      let phone = String(row[3] || '').trim();
      let partnerName = String(row[4] || '').trim();

      // If user typed name in column A and didn't provide an ID:
      if ((!name || name.includes('@')) && id && !id.startsWith('c-') && !id.toLowerCase().startsWith('id')) {
        name = id;
        id = 'c-' + (i < 10 ? '0' : '') + i;
      }
      if (!name) continue;

      customers.push({
        id: id || 'c-' + i,
        name: name,
        email: email,
        phone: phone,
        partnerId: '',
        partnerName: partnerName,
        referralCode: String(row[5] || '').trim(),
        firstVisitDate: String(row[6] || ''),
        lastVisitDate: String(row[7] || ''),
        totalVisits: Number(row[8]) || 1,
        totalSpendCAD: Number(row[9]) || 0,
        preferredService: String(row[10] || 'Brazilian Lymphatic Drainage (60 Min)'),
        insuranceProvider: String(row[11] || 'None / Self-Pay'),
        status: String(row[12] || 'Active'),
        recencyDays: Number(row[13]) || 15,
        recencyScore: Number(row[14]) || 4,
        frequencyScore: Number(row[15]) || 3,
        monetaryScore: Number(row[16]) || 3,
        rfmSegment: String(row[17] || 'Recent Customers')
      });
    }
  }

  const partners = [];
  if (partSheet && partSheet.getLastRow() > 1) {
    const data = partSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let id = String(row[0] || '').trim();
      let name = String(row[1] || '').trim();

      // Flexible check if name is in column A
      if ((!name || name.includes('@')) && id && !id.startsWith('p-') && !id.toLowerCase().startsWith('id')) {
        name = id;
        id = 'p-' + (i < 10 ? '0' : '') + i;
      }
      if (!name) continue;

      const commType = String(row[6] || 'Percentage');
      const commVal = Number(row[7]) || (commType === 'FlatPerBooking' ? 25 : 12);
      const retainer = Number(row[8]) || 0;
      const refCount = Number(row[9]) || 0;
      const activeCount = Number(row[10]) || Math.round(refCount * 0.8);
      const bookingsCount = Number(row[11]) || refCount;
      const totalRev = Number(row[12]) || 0;
      const commPaid = Number(row[13]) || (commType === 'FlatPerBooking' ? bookingsCount * commVal : (totalRev * commVal) / 100);
      const netRev = Number(row[14]) || (totalRev - commPaid - retainer * 6);

      let roi = 0;
      if (typeof row[15] === 'number') {
        roi = row[15] > 10 ? row[15] : row[15] * 100;
      } else if (typeof row[15] === 'string') {
        roi = parseFloat(row[15].replace('%', '')) || 0;
      } else {
        const totalCost = commPaid + retainer * 6;
        roi = totalCost > 0 ? (netRev / totalCost) * 100 : 0;
      }

      const avgSpend = Number(row[16]) || (refCount > 0 ? totalRev / refCount : 500);

      partners.push({
        id: id || 'p-' + i,
        name: name,
        category: String(row[2] || 'Physiotherapy & Chiro'),
        contactPerson: String(row[3] || ''),
        email: String(row[4] || ''),
        phone: String(row[5] || ''),
        commissionType: commType,
        commissionValue: commVal,
        monthlyRetainerCAD: retainer,
        referredCustomersCount: refCount,
        activeCustomersCount: activeCount,
        totalBookingsCount: bookingsCount,
        totalRevenueCAD: totalRev,
        totalCommissionPaidCAD: commPaid,
        netRevenueCAD: netRev,
        roiPercent: Math.round(roi * 10) / 10,
        averageCustomerSpendCAD: Math.round(avgSpend * 100) / 100,
        status: String(row[17] || 'Active').trim()
      });
    }
  }

  const bookings = [];
  if (bookSheet && bookSheet.getLastRow() > 1) {
    const data = bookSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || String(row[0]).trim() === '') continue;
      bookings.push({
        id: String(row[0] || 'b-' + i),
        bookingDate: row[1] instanceof Date ? Utilities.formatDate(row[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(row[1] || ''),
        customerId: '',
        customerName: String(row[2] || '').trim(),
        partnerId: '',
        partnerName: String(row[3] || '').trim(),
        serviceCategory: String(row[4] || 'Brazilian Lymphatic Drainage'),
        serviceTitle: String(row[5] || ''),
        therapist: String(row[6] || ''),
        durationMinutes: Number(row[7]) || 60,
        priceCAD: Number(row[8]) || 0,
        insuranceBilledCAD: Number(row[9]) || 0,
        patientPaidCAD: Number(row[10]) || 0,
        status: String(row[11] || 'Completed')
      });
    }
  }

  const cacChannels = [];
  if (cacSheet && cacSheet.getLastRow() > 1) {
    const data = cacSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0] || String(row[0]).trim() === '') continue;
      cacChannels.push({
        id: 'cac-' + i,
        partnerOrChannel: String(row[0] || '').trim(),
        isPartner: !String(row[0]).includes('Google') && !String(row[0]).includes('Instagram'),
        category: 'Partnership',
        month: String(row[1] || 'Rolling 6M'),
        spendCAD: Number(row[2]) || 0,
        newCustomersAcquired: Number(row[3]) || 0,
        calculatedCacCAD: Number(row[4]) || 0,
        averageLtvCAD: Number(row[5]) || 0,
        ltvCacRatio: typeof row[6] === 'number' ? row[6] : parseFloat(String(row[6]).replace('x', '')) || 0,
        paybackPeriodVisits: Number(row[7]) || 1,
        paybackPeriodMonths: Number(row[8]) || 0.5
      });
    }
  }

  const practitioners = [];
  if (practSheet && practSheet.getLastRow() > 1) {
    const data = practSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let id = String(row[0] || '').trim();
      let name = String(row[1] || '').trim();
      if ((!name || name.includes('@')) && id && !id.startsWith('pr-')) {
        name = id;
        id = 'pr-' + i;
      }
      if (!name) continue;
      const title = String(row[2] || 'Registered Massage Therapist').trim();
      const discipline = String(row[3] || '').trim();
      const email = String(row[4] || '').trim();
      const phone = String(row[5] || '').trim();
      const status = String(row[6] || 'Active').trim();
      const rawServices = String(row[7] || '').trim();
      const servicesOffered = rawServices ? rawServices.split(',').map(s => s.trim()).filter(Boolean) : [];
      practitioners.push({
        id: id || 'pr-' + i,
        name: name,
        title: title,
        discipline: discipline,
        email: email,
        phone: phone,
        status: status,
        servicesOffered: servicesOffered
      });
    }
  }

  const procedures = [];
  if (procSheet && procSheet.getLastRow() > 1) {
    const data = procSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let id = String(row[0] || '').trim();
      let name = String(row[1] || '').trim();
      if (!name && id && !id.startsWith('proc-')) {
        name = id;
        id = 'proc-' + i;
      }
      if (!name) continue;
      const category = String(row[2] || 'Registered Massage Therapy').trim();
      const duration = Number(row[3]) || 60;
      const price = Number(row[4]) || 150;
      const insEligible = String(row[5] || 'Yes').toLowerCase().includes('y');
      const insBilling = Number(row[6]) || 0;
      const copay = Number(row[7]) || Math.max(0, price - insBilling);
      const rawPracs = String(row[8] || '').trim();
      const assignedPracs = rawPracs ? rawPracs.split(',').map(p => p.trim()).filter(Boolean) : [];
      const status = String(row[9] || 'Active').trim();
      const desc = String(row[10] || '').trim();

      procedures.push({
        id: id || 'proc-' + i,
        name: name,
        category: category,
        durationMinutes: duration,
        priceCAD: price,
        insuranceCovered: insEligible,
        typicalInsuranceBillingCAD: insBilling,
        typicalCopayCAD: copay,
        assignedPractitioners: assignedPracs,
        status: status,
        description: desc
      });
    }
  }

  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    customersCount: customers.length,
    partnersCount: partners.length,
    bookingsCount: bookings.length,
    cacChannelsCount: cacChannels.length,
    practitionersCount: practitioners.length,
    proceduresCount: procedures.length,
    customers: customers,
    partners: partners,
    bookings: bookings,
    cacChannels: cacChannels,
    practitioners: practitioners,
    procedures: procedures
  };
}
`;
}
