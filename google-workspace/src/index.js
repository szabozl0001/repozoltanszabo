import 'dotenv/config';
import express from 'express';
import { createSheet, appendRows, readSheet } from './sheets.js';
import { createDoc, readDoc, appendToDoc } from './docs.js';
import { listFiles, deleteFile } from './drive.js';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Sheets ────────────────────────────────────────────────────────────────────

// POST /sheets  { title, headers[], rows[][] }
app.post('/sheets', async (req, res) => {
  try {
    const result = await createSheet(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /sheets/:id/rows  { sheetName?, rows[][] }
app.post('/sheets/:id/rows', async (req, res) => {
  try {
    const result = await appendRows({ spreadsheetId: req.params.id, ...req.body });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /sheets/:id  ?sheetName=Sheet1
app.get('/sheets/:id', async (req, res) => {
  try {
    const rows = await readSheet({ spreadsheetId: req.params.id, sheetName: req.query.sheetName });
    res.json({ rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Docs ──────────────────────────────────────────────────────────────────────

// POST /docs  { title, content? }
app.post('/docs', async (req, res) => {
  try {
    const result = await createDoc(req.body);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /docs/:id
app.get('/docs/:id', async (req, res) => {
  try {
    const result = await readDoc({ documentId: req.params.id });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /docs/:id/append  { text }
app.post('/docs/:id/append', async (req, res) => {
  try {
    const result = await appendToDoc({ documentId: req.params.id, text: req.body.text });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Drive ─────────────────────────────────────────────────────────────────────

// GET /drive  ?mimeType=...&pageSize=20
app.get('/drive', async (req, res) => {
  try {
    const files = await listFiles(req.query);
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /drive/:id
app.delete('/drive/:id', async (req, res) => {
  try {
    const result = await deleteFile({ fileId: req.params.id });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Google Workspace API running on http://localhost:${PORT}`);
});
