import express from 'express';
import cors from 'cors';
import shabbatotRouter from './routes/shabbatot';
import historyRouter from './routes/history';
import { errorHandler } from './middleware/errorHandler';
import { initCurrentHebrewYear } from './services/hebrewYearService';
import { archivePassedShabbatot } from './services/historyService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/shabbatot', shabbatotRouter);
app.use('/api/history', historyRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`One More Shabbat API running on http://localhost:${PORT}`);
  try {
    initCurrentHebrewYear();
    archivePassedShabbatot();
  } catch (err) {
    console.error('[init] Failed to initialize:', err);
  }
});

export default app;
