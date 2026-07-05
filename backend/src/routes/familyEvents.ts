import { Router, Request, Response } from 'express';
import {
  getEventsForShabbatWeek,
  getCountsForShabbatot,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../services/familyEventsService';

const router = Router();
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/family-events/counts?dates=2026-07-04,2026-07-11
router.get('/counts', (req: Request, res: Response) => {
  const datesParam = String(req.query.dates ?? '');
  const dates = datesParam.split(',').filter(d => ISO_DATE.test(d));
  res.json(getCountsForShabbatot(dates));
});

// GET /api/family-events/week/2026-07-04
router.get('/week/:date', (req: Request, res: Response) => {
  const { date } = req.params;
  if (!ISO_DATE.test(date)) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  }
  res.json(getEventsForShabbatWeek(date));
});

// POST /api/family-events
router.post('/', (req: Request, res: Response) => {
  try {
    res.status(201).json(createEvent(req.body));
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid input' });
  }
});

// PUT /api/family-events/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const updated = updateEvent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'invalid input' });
  }
});

// DELETE /api/family-events/:id
router.delete('/:id', (req: Request, res: Response) => {
  const ok = deleteEvent(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

export default router;
