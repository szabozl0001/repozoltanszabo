// ── Entry point ───────────────────────────────────────────────────────────────

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Workspace Tool')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ── Sheets ────────────────────────────────────────────────────────────────────

function createSheet(title, headers, rows) {
  const ss = SpreadsheetApp.create(title);

  if (headers && headers.length) {
    const sheet = ss.getActiveSheet();
    sheet.appendRow(headers);
    if (rows && rows.length) {
      rows.forEach(row => sheet.appendRow(row));
    }
    // Bold the header row
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  return {
    id:  ss.getId(),
    url: ss.getUrl(),
    title: ss.getName()
  };
}

function appendRowsToSheet(spreadsheetId, rows) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getActiveSheet();
  rows.forEach(row => sheet.appendRow(row));
  return { ok: true, lastRow: sheet.getLastRow() };
}

function readSheet(spreadsheetId) {
  const ss    = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getActiveSheet();
  const data  = sheet.getDataRange().getValues();
  return { title: ss.getName(), rows: data };
}

// ── Docs ──────────────────────────────────────────────────────────────────────

function createDoc(title, content) {
  const doc  = DocumentApp.create(title);
  const body = doc.getBody();

  if (content) {
    body.appendParagraph(content);
  }

  doc.saveAndClose();
  return {
    id:  doc.getId(),
    url: doc.getUrl(),
    title: doc.getName()
  };
}

function readDoc(documentId) {
  const doc  = DocumentApp.openById(documentId);
  const text = doc.getBody().getText();
  return { title: doc.getName(), text };
}

function appendToDoc(documentId, text) {
  const doc  = DocumentApp.openById(documentId);
  const body = doc.getBody();
  body.appendParagraph(text);
  doc.saveAndClose();
  return { ok: true };
}

// ── Drive ─────────────────────────────────────────────────────────────────────

function listFiles(mimeTypeFilter) {
  let query = 'trashed = false';
  if (mimeTypeFilter) query += ` and mimeType = '${mimeTypeFilter}'`;

  const files  = DriveApp.searchFiles(query);
  const result = [];

  while (files.hasNext()) {
    const f = files.next();
    result.push({
      id:       f.getId(),
      name:     f.getName(),
      mimeType: f.getMimeType(),
      url:      f.getUrl(),
      modified: f.getLastUpdated().toISOString()
    });
    if (result.length >= 50) break;
  }

  return result;
}

function deleteFile(fileId) {
  DriveApp.getFileById(fileId).setTrashed(true);
  return { ok: true };
}

// ── Helper: get recent Sheets and Docs for the dashboard ─────────────────────

function getDashboardData() {
  const sheets = listFiles('application/vnd.google-apps.spreadsheet');
  const docs   = listFiles('application/vnd.google-apps.document');
  return {
    sheets: sheets.slice(0, 10),
    docs:   docs.slice(0, 10)
  };
}
