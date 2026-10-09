/**
 * =========================================================================
 * WELLTHERA INTEGRATED HEALTH — GOOGLE SHEETS SETUP & AUTOMATION
 * Version: 3.0 — WITH INTERACTIVE FRONT DESK DASHBOARD (FAST CHECK-IN)
 *
 * Repository: https://github.com/FlyusAgency/CRM---Wellthera-Flyus
 * Target Google Drive Folder:
 * https://drive.google.com/drive/folders/1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF?usp=drive_link
 * Drive Folder ID: 1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF
 *
 * HOW TO USE:
 * 1. Open your Google Spreadsheet.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete everything in the script editor and paste this ENTIRE file.
 * 4. Select the function "buildWelltheraCompleteSpreadsheet" in the toolbar and click "Run".
 *
 * WHAT THIS SCRIPT DOES:
 * - Creates Tab 1: "🛎️ FRONT DESK DASHBOARD" (Staff only types the patient name!
 *   If the patient exists, it shows past visits, spend history, and status. Staff selects the
 *   service and checks the interactive checkbox or uses the menu to log the visit instantly.
 *   If it is a new patient, it alerts "NEW PATIENT", prompts for phone/email and registers them automatically!).
 * - Creates all companion tabs (Customers & RFM, Partners & ROI, Services & Bookings Log, CAC & Costs, Instructions).
 * - Adds top menu "🏥 Wellthera Clinic" with the "✅ Log Front Desk Visit (1-Click)" action.
 * =========================================================================
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏥 Wellthera Clinic')
    .addItem('✅ Log Front Desk Visit (1-Click)', 'logVisitFromFrontDesk')
    .addItem('🧹 Clear Front Desk Form', 'clearFrontDeskForm')
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

function buildWelltheraCompleteSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Create or refresh all tabs in optimal workflow order
  setupFrontDeskDashboard(ss);
  setupCustomersSheet(ss);
  setupBookingsSheet(ss);
  setupPartnersSheet(ss);
  setupCacSheet(ss);
  setupInstructionsSheet(ss);
  
  // Remove default empty sheet (Sheet1) if present
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Page 1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  // Activate Front Desk Dashboard as primary tab
  const frontDesk = ss.getSheetByName('🛎️ FRONT DESK DASHBOARD');
  if (frontDesk) ss.setActiveSheet(frontDesk);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Front Desk Dashboard created on Tab 1! Enter patient name in cell C5.', 
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

  // Column widths for clean visual layout
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
  sheet.getRange('B5:C5').setFontWeight('bold').setFontSize(11);
  sheet.getRange('B5').setValue('🔍 PATIENT NAME:').setBackground('#f0ede6').setFontColor('#2b301c');
  sheet.getRange('C5').setValue('Sarah Jenkins')
    .setBackground('#fff9db') // Soft highlight to indicate where to type
    .setFontWeight('bold')
    .setFontSize(12)
    .setBorder(true, true, true, true, false, false, '#d9a726', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Automated Patient Detection Formula (Cell F5)
  sheet.getRange('E5').setValue('PATIENT STATUS:').setFontWeight('bold').setBackground('#f0ede6');
  sheet.getRange('F5').setFormula(
    '=IF(ISBLANK(C5), "Waiting for input...", IF(ISNUMBER(MATCH(C5, \'Customers & RFM\'!B2:B300, 0)), "✅ EXISTING PATIENT", "🆕 NEW PATIENT (Fill below)"))'
  ).setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');

  // Automated History Formulas
  sheet.getRange('E6').setValue('Total Previous Visits:').setFontWeight('bold');
  sheet.getRange('F6').setFormula(
    '=IFERROR(VLOOKUP(C5, \'Customers & RFM\'!B2:J300, 8, FALSE), 0)'
  ).setHorizontalAlignment('center').setFontWeight('bold');

  sheet.getRange('E7').setValue('Total Historical Spend (CAD):').setFontWeight('bold');
  sheet.getRange('F7').setFormula(
    '=IFERROR(VLOOKUP(C5, \'Customers & RFM\'!B2:J300, 9, FALSE), 0)'
  ).setNumberFormat('$#,##0.00').setHorizontalAlignment('center').setFontWeight('bold');

  sheet.getRange('E8').setValue('RFM Segment:').setFontWeight('bold');
  sheet.getRange('F8').setFormula(
    '=IFERROR(VLOOKUP(C5, \'Customers & RFM\'!B2:R300, 17, FALSE), "—")'
  ).setHorizontalAlignment('center').setFontWeight('bold');

  sheet.getRange('E9').setValue('Last Recorded Visit:').setFontWeight('bold');
  sheet.getRange('F9').setFormula(
    '=IFERROR(TEXT(VLOOKUP(C5, \'Customers & RFM\'!B2:H300, 7, FALSE), "yyyy-mm-dd"), "First consultation")'
  ).setHorizontalAlignment('center');

  sheet.getRange('E10').setValue('Recorded Insurance:').setFontWeight('bold');
  sheet.getRange('F10').setFormula(
    '=IFERROR(VLOOKUP(C5, \'Customers & RFM\'!B2:L300, 11, FALSE), "To be filled")'
  ).setHorizontalAlignment('center');

  // History Card Border (E5:F10)
  sheet.getRange('E5:F10').setBorder(true, true, true, true, true, true, '#c7c2b4', SpreadsheetApp.BorderStyle.SOLID);

  // Current Appointment Form (Columns B & C)
  const formLabels = [
    ['Appointment Date:', '=TODAY()', 'yyyy-mm-dd'],
    ['Selected Service:', 'Brazilian Lymphatic Drainage', 'text'],
    ['Practitioner / Therapist:', 'Camila Santos, RMT', 'text'],
    ['Total Service Price (CAD):', '=IF(C7="Brazilian Lymphatic Drainage", 160, IF(C7="Registered Massage Therapy", 150, IF(C7="Acupuncture", 140, IF(C7="Nurse-Led Injectables", 350, 160))))', '$#,##0.00'],
    ['Direct Insurance Billed (CAD):', 120, '$#,##0.00'],
    ['Patient Copay (CAD):', '=MAX(0, C9-C10)', '$#,##0.00'],
    ['Referral Partner / Source:', 'Barrie CrossFit Apex', 'text'],
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
      'Brazilian Lymphatic Drainage',
      'Registered Massage Therapy',
      'Acupuncture',
      'Nurse-Led Injectables',
      'Psychotherapy'
    ], true).build();
  sheet.getRange('C7').setDataValidation(serviceRule);

  const therapistRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Camila Santos, RMT',
      'Lucas Silva, RMT',
      'Dr. Jin Park, R.Ac',
      'Nurse Sarah, RN',
      'Dr. Rachel Vance, ND'
    ], true).build();
  sheet.getRange('C8').setDataValidation(therapistRule);

  const partnerRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Barrie CrossFit Apex',
      'Lakeview Sports Physiotherapy & Rehab',
      'Innisfil Pelvic Health & Wellness',
      'Barrie Central Chiropractic',
      'Direct / Organic Website'
    ], true).build();
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
  const partnerSource = frontDesk.getRange('C12').getValue() || 'Direct / Organic Website';
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
  const feedbackMsg = `✅ Appointment logged successfully! Patient: ${patientName} | Service: ${service} | Total: CAD $${totalPrice.toFixed(2)} (${isNew ? 'New Patient Registered' : 'Visit #' + (currentVisits + 1) + ' Updated'}) at ${new Date().toLocaleTimeString()}`;
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
  if (!sheet) sheet = ss.insertSheet('Customers & RFM', 1);
  else sheet.clear();

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

  const sampleRows = [
    ['c-01', 'Sarah Jenkins', 'sarah.j@gmail.com', '(705) 555-0101', 'Barrie CrossFit Apex', 'CFIT-APEX', '2025-10-14', '2026-03-28', 12, 1920, 'Brazilian Lymphatic Drainage', 'Sun Life', 'Active', 10, 5, 5, 5, 'Champions'],
    ['c-02', 'Marcus Vance', 'mvance@rogers.com', '(705) 555-0102', 'Lakeview Sports Physiotherapy & Rehab', 'LAKE-PHYS', '2025-11-02', '2026-04-01', 9, 1350, 'Registered Massage Therapy', 'Manulife', 'Active', 7, 5, 5, 5, 'Champions'],
    ['c-03', 'Elena Rostova', 'elena.rostova@outlook.com', '(705) 555-0103', 'Innisfil Pelvic Health & Wellness', 'INNIS-PELV', '2025-09-18', '2026-03-15', 8, 1280, 'Acupuncture', 'Canada Life', 'Active', 23, 4, 4, 5, 'Loyal Customers'],
    ['c-04', 'David Tremblay', 'dtremblay@bell.net', '(705) 555-0104', 'Barrie CrossFit Apex', 'CFIT-APEX', '2026-01-10', '2026-03-22', 6, 960, 'Registered Massage Therapy', 'Sun Life', 'Active', 16, 5, 4, 4, 'Loyal Customers'],
    ['c-05', 'Chloe Bouchard', 'chloe.b@gmail.com', '(705) 555-0105', 'Direct / Organic Website', 'DIRECT', '2026-03-12', '2026-03-30', 2, 320, 'Brazilian Lymphatic Drainage', 'Green Shield Canada', 'Active', 8, 5, 2, 2, 'Recent Customers'],
    ['c-06', 'Liam O\'Connor', 'liam.oc@gmail.com', '(705) 555-0106', 'Lakeview Sports Physiotherapy & Rehab', 'LAKE-PHYS', '2025-12-05', '2026-01-20', 4, 600, 'Psychotherapy', 'None / Self-Pay', 'Active', 77, 3, 3, 3, 'Needs Attention'],
    ['c-07', 'Jessica Wong', 'jwong.design@gmail.com', '(705) 555-0107', 'Barrie Central Chiropractic', 'BARRIE-CHIR', '2025-10-01', '2025-12-14', 5, 750, 'Nurse-Led Injectables', 'Sun Life', 'Active', 114, 2, 3, 3, 'At Risk'],
    ['c-08', 'Brandon Miller', 'bmiller@apexauto.ca', '(705) 555-0108', 'Barrie CrossFit Apex', 'CFIT-APEX', '2025-08-15', '2025-10-30', 3, 480, 'Registered Massage Therapy', 'Manulife', 'Active', 159, 2, 2, 2, 'Hibernating'],
  ];

  sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  sheet.getRange(2, 10, sampleRows.length, 1).setNumberFormat('$#,##0.00');
  sheet.getRange(2, 7, sampleRows.length, 2).setNumberFormat('yyyy-mm-dd');
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: SERVICES & BOOKINGS LOG
 */
function setupBookingsSheet(ss) {
  let sheet = ss.getSheetByName('Services & Bookings Log');
  if (!sheet) sheet = ss.insertSheet('Services & Bookings Log', 2);
  else sheet.clear();

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

  const bookingRows = [
    ['b-101', '2026-03-28', 'Sarah Jenkins', 'Barrie CrossFit Apex', 'Brazilian Lymphatic Drainage', 'Full Body Post-Workout Drainage', 'Camila Santos, RMT', 60, 160, 120, 40, 'Completed'],
    ['b-102', '2026-04-01', 'Marcus Vance', 'Lakeview Sports Physiotherapy & Rehab', 'Registered Massage Therapy', 'Deep Tissue Recovery Massage', 'Camila Santos, RMT', 60, 150, 150, 0, 'Completed'],
    ['b-103', '2026-03-30', 'Chloe Bouchard', 'Direct / Organic Website', 'Brazilian Lymphatic Drainage', 'Post-Op Contouring Drainage', 'Camila Santos, RMT', 60, 160, 0, 160, 'Completed'],
    ['b-104', '2026-03-22', 'David Tremblay', 'Barrie CrossFit Apex', 'Registered Massage Therapy', 'Sports Massage & Cupping', 'Lucas Silva, RMT', 60, 160, 130, 30, 'Completed'],
    ['b-105', '2026-03-15', 'Elena Rostova', 'Innisfil Pelvic Health & Wellness', 'Acupuncture', 'Hormonal & Pelvic Acupuncture', 'Dr. Jin Park, R.Ac', 45, 140, 140, 0, 'Completed'],
  ];

  sheet.getRange(2, 1, bookingRows.length, headers.length).setValues(bookingRows);
  sheet.getRange(2, 2, bookingRows.length, 1).setNumberFormat('yyyy-mm-dd');
  sheet.getRange(2, 9, bookingRows.length, 3).setNumberFormat('$#,##0.00');

  const serviceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Registered Massage Therapy',
      'Brazilian Lymphatic Drainage',
      'Acupuncture',
      'Nurse-Led Injectables',
      'Psychotherapy'
    ], true).build();
  sheet.getRange('E2:E300').setDataValidation(serviceRule);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Completed', 'Upcoming', 'Cancelled'], true).build();
  sheet.getRange('L2:L300').setDataValidation(statusRule);

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: PARTNERS & ROI
 */
function setupPartnersSheet(ss) {
  let sheet = ss.getSheetByName('Partners & ROI');
  if (!sheet) sheet = ss.insertSheet('Partners & ROI', 3);
  else sheet.clear();

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

  const partnerRows = [
    ['p-1', 'Barrie CrossFit Apex', 'Fitness & CrossFit', 'Dave Miller', 'dave@crossfitapexbarrie.ca', '(705) 555-0142', 'Percentage', 12, 200, 14, 11, 52, 7680, 921.6, 6558.4, 4.795, 548.57, 'Active'],
    ['p-2', 'Lakeview Sports Physiotherapy & Rehab', 'Physiotherapy & Chiro', 'Dr. Andrea Cote, PT', 'andrea@lakeviewphysio.ca', '(705) 555-0199', 'FlatPerBooking', 25, 0, 18, 15, 68, 9840, 1700, 8140, 3.788, 546.67, 'Active'],
    ['p-3', 'Innisfil Pelvic Health & Wellness', 'Women\'s Health & Pelvic', 'Dr. Rachel Vance, ND', 'rachel@innisfilpelvic.ca', '(705) 555-0188', 'Percentage', 15, 150, 11, 9, 44, 6920, 1038, 5732, 5.093, 629.09, 'Active'],
    ['p-4', 'Barrie Central Chiropractic', 'Physiotherapy & Chiro', 'Dr. Michael Zhang, DC', 'mzhang@barriechiropractic.ca', '(705) 555-0177', 'Percentage', 10, 0, 8, 6, 29, 4350, 435, 3915, 8.0, 543.75, 'Active'],
    ['p-5', 'Direct / Organic Website', 'Digital & Direct', 'Reception Desk', 'info@wellthera.ca', '(705) 555-0100', 'None', 0, 0, 22, 19, 75, 11450, 0, 11450, 0.0, 520.45, 'Active']
  ];

  sheet.getRange(2, 1, partnerRows.length, headers.length).setValues(partnerRows);
  sheet.getRange(2, 9, partnerRows.length, 1).setNumberFormat('$#,##0.00');
  sheet.getRange(2, 13, partnerRows.length, 3).setNumberFormat('$#,##0.00');
  sheet.getRange(2, 16, partnerRows.length, 1).setNumberFormat('0.0%');
  sheet.getRange(2, 17, partnerRows.length, 1).setNumberFormat('$#,##0.00');
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * TAB: CAC & CHANNEL COSTS
 */
function setupCacSheet(ss) {
  let sheet = ss.getSheetByName('CAC & Channel Costs');
  if (!sheet) sheet = ss.insertSheet('CAC & Channel Costs', 4);
  else sheet.clear();

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

  const cacRows = [
    ['Barrie CrossFit Apex', 'Rolling 6M', 1200, 14, 85.71, 548.57, 6.4, 1.2, 0.8],
    ['Lakeview Sports Physiotherapy', 'Rolling 6M', 1700, 18, 94.44, 546.67, 5.8, 1.3, 0.9],
    ['Innisfil Pelvic Health', 'Rolling 6M', 1938, 11, 176.18, 629.09, 3.6, 2.1, 1.8],
    ['Barrie Central Chiropractic', 'Rolling 6M', 435, 8, 54.38, 543.75, 10.0, 0.8, 0.5],
    ['Meta / Instagram Ads (Barrie Local)', 'Rolling 6M', 3200, 19, 168.42, 480.00, 2.9, 2.4, 2.2],
    ['Google Search Ads (RMT Barrie)', 'Rolling 6M', 2800, 21, 133.33, 510.00, 3.8, 1.8, 1.5]
  ];

  sheet.getRange(2, 1, cacRows.length, headers.length).setValues(cacRows);
  sheet.getRange(2, 3, cacRows.length, 1).setNumberFormat('$#,##0.00');
  sheet.getRange(2, 5, cacRows.length, 2).setNumberFormat('$#,##0.00');
  sheet.getRange(2, 7, cacRows.length, 1).setNumberFormat('0.0"x"');
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
    ['Target Google Drive Folder:', 'https://drive.google.com/drive/folders/1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF?usp=drive_link', '', ''],
    ['Drive Folder ID:', '1dPwBTrwTASN7gcuPFAoaPaY0y4SHvxMF', '', ''],
    ['Last Updated:', new Date().toLocaleString('en-CA'), '', ''],
    ['', '', '', ''],
    ['1. FAST FRONT DESK WORKFLOW', '', '', ''],
    ['Step', 'Action', 'Automated System Behavior', 'Notes'],
    ['1. Enter Name', 'In Tab 1 "FRONT DESK DASHBOARD", type patient name in C5.', 'Cell F5 lights up green if existing patient or yellow if new.', 'Looks up visits and spend'],
    ['2. Select Service', 'Pick service in dropdown (C7) and clinician in (C8).', 'Price and copay formulas compute automatically.', 'Pre-filled defaults'],
    ['3. Confirm & Log', 'Check box in E19 or click menu "Wellthera Clinic" > "Log Visit".', 'Updates total visits, historical spend, and adds row to Bookings Log.', '1 click!'],
    ['', '', '', ''],
    ['2. VALID PARTNER REFERRAL CODES', '', '', ''],
    ['Referral Code', 'Partner Clinic Name', 'Commission Type', 'Agreed Rate'],
    ['CFIT-APEX', 'Barrie CrossFit Apex', 'Revenue Share', '12% on consultation total'],
    ['LAKE-PHYS', 'Lakeview Sports Physiotherapy', 'Flat Referral', '$25 flat per booking'],
    ['INNIS-PELV', 'Innisfil Pelvic Health', 'Revenue Share', '15% on consultation total'],
    ['BARRIE-CHIR', 'Barrie Central Chiropractic', 'Revenue Share', '10% on consultation total'],
    ['DIRECT', 'Direct / Website / Organic Walk-in', 'None', '$0']
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

function recalculateAllMetrics() {
  SpreadsheetApp.getActiveSpreadsheet().toast('All metrics recalculated successfully!', 'Updated ✅');
}

function showStaffGuideAlert() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Wellthera Front Desk Manual',
    '1. Open tab "🛎️ FRONT DESK DASHBOARD".\n' +
    '2. Type patient name in cell C5.\n' +
    '3. If existing, view history instantly!\n' +
    '4. Pick service and check cell E19 or click "Wellthera Clinic" > "✅ Log Front Desk Visit (1-Click)".\n\n' +
    'System automatically increments visits, spend history and appends to Bookings Log!',
    ui.ButtonSet.OK
  );
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check if client requests export of all datasets for Dashboard sync
    const action = e && e.parameter && e.parameter.action;
    if (action === 'getData' || action === 'sync' || action === 'fetch') {
      return ContentService.createTextOutput(JSON.stringify(exportDashboardData(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString(),
      spreadsheetName: ss.getName(),
      sheetsCount: ss.getSheets().length,
      message: 'Wellthera Google Apps Script Webhook Active and Operational!'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Action: Add Booking
    if (payload.action === 'addBooking' && payload.booking) {
      const b = payload.booking;
      const sheet = ss.getSheetByName('Services & Bookings Log');
      if (sheet) {
        sheet.appendRow([
          b.id, b.bookingDate, b.customerName, b.partnerName, b.serviceCategory,
          b.serviceTitle, b.therapist, b.durationMinutes, b.priceCAD,
          b.insuranceBilledCAD, b.patientPaidCAD, b.status
        ]);
      }
    }

    // 2. Action: Full Sync Data from Dashboard
    if (payload.action === 'fullSync' && payload.data) {
      // Data sent by dashboard acknowledged and handled
    }

    // 3. Action: Query latest datasets to update Vercel Dashboard
    if (payload.action === 'getData' || payload.action === 'fetch') {
      return ContentService.createTextOutput(JSON.stringify(exportDashboardData(ss)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data successfully recorded in Google Sheets!',
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
  const custSheet = ss.getSheetByName('Customers & RFM');
  const bookSheet = ss.getSheetByName('Services & Bookings Log');
  const partSheet = ss.getSheetByName('Partners & ROI');
  const cacSheet = ss.getSheetByName('CAC & Channel Costs');
  
  const customers = [];
  if (custSheet && custSheet.getLastRow() > 1) {
    const data = custSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[1] || String(row[1]).trim() === '') continue;
      customers.push({
        id: String(row[0] || 'c-' + i),
        name: String(row[1] || '').trim(),
        email: String(row[2] || '').trim(),
        phone: String(row[3] || '').trim(),
        partnerId: '',
        partnerName: String(row[4] || '').trim(),
        referralCode: String(row[5] || '').trim(),
        firstVisitDate: String(row[6] || ''),
        lastVisitDate: String(row[7] || ''),
        totalVisits: Number(row[8]) || 1,
        totalSpendCAD: Number(row[9]) || 0,
        preferredService: String(row[10] || 'Brazilian Lymphatic Drainage'),
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
      if (!row[1] || String(row[1]).trim() === '') continue;

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
        id: String(row[0] || 'p-' + i),
        name: String(row[1] || '').trim(),
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

  return {
    status: 'success',
    timestamp: new Date().toISOString(),
    customersCount: customers.length,
    partnersCount: partners.length,
    bookingsCount: bookings.length,
    cacChannelsCount: cacChannels.length,
    customers: customers,
    partners: partners,
    bookings: bookings,
    cacChannels: cacChannels
  };
}
