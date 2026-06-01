import { Router, Request, Response } from 'express';
import * as historyService from '../services/historyService';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json(historyService.getAll());
});

export default router;
