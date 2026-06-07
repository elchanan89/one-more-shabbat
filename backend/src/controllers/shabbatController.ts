import { Request, Response } from 'express';
import * as shabbatService from '../services/shabbatService';
import { getHebrewInfo } from '../services/hebrewCalendarService';
import { archivePassedShabbatot } from '../services/historyService';

export function getAll(req: Request, res: Response): void {
  // Keep history current on every app load (server may run for weeks without restart).
  archivePassedShabbatot();
  res.json(shabbatService.getAll());
}

export function getOne(req: Request, res: Response): void {
  const event = shabbatService.getById(req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(event);
}

export function create(req: Request, res: Response): void {
  const { gregorianDate } = req.body;

  if (!gregorianDate) {
    res.status(400).json({ error: 'gregorianDate is required' });
    return;
  }

  let hebrewDate = req.body.hebrewDate || '';
  let parasha = req.body.parasha || '';
  let parashaHe = req.body.parashaHe || '';

  try {
    const info = getHebrewInfo(gregorianDate);
    hebrewDate = info.hebrewDate;
    parasha = info.parasha;
    parashaHe = info.parashaHe;
  } catch {
    // fall through — use values from request body
  }

  const event = shabbatService.create({ gregorianDate, hebrewDate, parasha, parashaHe });

  res.status(201).json(event);
}

export function update(req: Request, res: Response): void {
  const updated = shabbatService.update(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(updated);
}

export function remove(req: Request, res: Response): void {
  const deleted = shabbatService.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
}

export function getHebrewInfoForDate(req: Request, res: Response): void {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });
    return;
  }
  try {
    const info = getHebrewInfo(date);
    res.json(info);
  } catch (err) {
    res.status(400).json({ error: 'Invalid date or could not calculate Hebrew info' });
  }
}
