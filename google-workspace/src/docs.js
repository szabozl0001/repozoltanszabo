import { google } from 'googleapis';
import { getAuth } from './auth.js';

const docs  = google.docs({ version: 'v1' });
const drive = google.drive({ version: 'v3' });

// Create a new Google Doc with optional text content
export async function createDoc({ title, content = '' }) {
  const auth = getAuth();

  const doc = await docs.documents.create({
    auth,
    requestBody: { title },
  });

  const docId = doc.data.documentId;

  if (content) {
    await docs.documents.batchUpdate({
      auth,
      documentId: docId,
      requestBody: {
        requests: [{
          insertText: {
            location: { index: 1 },
            text: content,
          }
        }]
      }
    });
  }

  await moveToFolder(auth, docId);

  return {
    id: docId,
    url: `https://docs.google.com/document/d/${docId}/edit`,
    title,
  };
}

// Read the full plain text content of a Doc
export async function readDoc({ documentId }) {
  const auth = getAuth();
  const doc = await docs.documents.get({ auth, documentId });

  const text = (doc.data.body?.content || [])
    .flatMap(el => el.paragraph?.elements || [])
    .map(el => el.textRun?.content || '')
    .join('');

  return { title: doc.data.title, text };
}

// Append text to the end of an existing Doc
export async function appendToDoc({ documentId, text }) {
  const auth = getAuth();
  const doc = await docs.documents.get({ auth, documentId, fields: 'body' });

  const endIndex = doc.data.body.content.at(-1)?.endIndex ?? 1;

  await docs.documents.batchUpdate({
    auth,
    documentId,
    requestBody: {
      requests: [{
        insertText: {
          location: { index: endIndex - 1 },
          text,
        }
      }]
    }
  });

  return { ok: true };
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
