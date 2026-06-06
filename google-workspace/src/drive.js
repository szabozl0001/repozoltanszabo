import { google } from 'googleapis';
import { getAuth } from './auth.js';

const drive = google.drive({ version: 'v3' });

// List files in the configured Drive folder (or root if no folder set)
export async function listFiles({ pageSize = 20, mimeType } = {}) {
  const auth = getAuth();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const q = [
    folderId ? `'${folderId}' in parents` : null,
    mimeType  ? `mimeType='${mimeType}'`   : null,
    'trashed=false',
  ].filter(Boolean).join(' and ');

  const res = await drive.files.list({
    auth,
    q,
    pageSize,
    fields: 'files(id, name, mimeType, webViewLink, createdTime, modifiedTime)',
    orderBy: 'modifiedTime desc',
  });

  return res.data.files ?? [];
}

// Delete a file by ID
export async function deleteFile({ fileId }) {
  const auth = getAuth();
  await drive.files.delete({ auth, fileId });
  return { ok: true };
}
