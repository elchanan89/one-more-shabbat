import { Router, Request, Response } from 'express';
import * as historyService from '../services/historyService';
import { HISTORY_EDIT_PASSWORD } from '../config';

const router = Router();

function isCorrectPassword(candidate: unknown): boolean {
  return typeof candidate === 'string'
    && candidate.trim().toLowerCase() === HISTORY_EDIT_PASSWORD.trim().toLowerCase();
}

router.get('/', (_req: Request, res: Response) => {
  // Archive any Shabbatot that have passed since the server started, so history
  // stays current without needing a restart.
  historyService.archivePassedShabbatot();
  res.json(historyService.getAll());
});

router.post('/verify-password', (req: Request, res: Response) => {
  res.json({ valid: isCorrectPassword(req.body.password) });
});

router.put('/:id', (req: Request, res: Response) => {
  if (!isCorrectPassword(req.body.password)) {
    res.status(403).json({ error: 'סיסמה שגויה' });
    return;
  }
  const updated = historyService.update(req.params.id, req.body.description);
  if (!updated) {
    res.status(404).json({ error: 'History record not found' });
    return;
  }
  res.json(updated);
});

export default router;
