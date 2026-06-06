import { google } from 'googleapis';
import { getAuth } from './auth.js';

const sheets = google.sheets({ version: 'v4' });
const drive  = google.drive({ version: 'v3' });

// Create a new spreadsheet, optionally move it into the configured Drive folder
export async function createSheet({ title, headers = [], rows = [] }) {
  const auth = getAuth();

  const spreadsheet = await sheets.spreadsheets.create({
    auth,
    requestBody: {
      properties: { title },
      sheets: [{
        properties: { title: 'Sheet1' },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [headers, ...rows].filter(r => r.length).map(row => ({
            values: row.map(v => ({ userEnteredValue: { stringValue: String(v) } }))
          }))
        }]
      }]
    }
  });

  const id = spreadsheet.data.spreadsheetId;
  await moveToFolder(auth, id);

  return {
    id,
    url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
    title,
  };
}

// Append rows to an existing spreadsheet
export async function appendRows({ spreadsheetId, sheetName = 'Sheet1', rows }) {
  const auth = getAuth();
  const range = `${sheetName}!A1`;

  const result = await sheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rows },
  });

  return { updatedRows: result.data.updates?.updatedRows ?? 0 };
}

// Read all rows from a sheet
export async function readSheet({ spreadsheetId, sheetName = 'Sheet1' }) {
  const auth = getAuth();

  const result = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: `${sheetName}!A1:ZZ`,
  });

  return result.data.values ?? [];
}

async function moveToFolder(auth, fileId) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) return;
  const file = await drive.files.get({ auth, fileId, fields: 'parents' });
  const prevParents = (file.data.parents || []).join(',');
  await drive.files.update({
    auth,
    fileId,
    addParents: folderId,
    removeParents: prevParents,
    fields: 'id, parents',
  });
}
