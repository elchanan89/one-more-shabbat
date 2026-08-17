import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs';
import shabbatotRouter from './routes/shabbatot';
import historyRouter from './routes/history';
import familyEventsRouter from './routes/familyEvents';
import { errorHandler } from './middleware/errorHandler';
import { initUpcomingHebrewYears, refreshParashaMetadata } from './services/hebrewYearService';
import { archivePassedShabbatot } from './services/historyService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── API ──────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/shabbatot', shabbatotRouter);
app.use('/api/history', historyRouter);
app.use('/api/family-events', familyEventsRouter);

// ── Static frontend (production single-service) ───
// Angular build output. dist/app.js → ../../frontend/dist/frontend/browser
const FRONTEND_DIR = path.join(__dirname, '../../frontend/dist/frontend/browser');
if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));
  // SPA fallback: any non-API GET returns index.html
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
  });
  console.log(`[static] Serving frontend from ${FRONTEND_DIR}`);
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`One More Shabbat API running on port ${PORT}`);
  try {
    initUpcomingHebrewYears();
    refreshParashaMetadata();
    archivePassedShabbatot();
  } catch (err) {
    console.error('[init] Failed to initialize:', err);
  }
});

export default app;
