import { Router, Request, Response } from 'express';
import * as historyService from '../services/historyService';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  // Archive any Shabbatot that have passed since the server started, so history
  // stays current without needing a restart.
  historyService.archivePassedShabbatot();
  res.json(historyService.getAll());
});

export default router;
