import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ShabbatEvent } from '../models/shabbat.model';

const DATA_FILE = path.join(__dirname, '../../data/shabbatot.json');

function readData(): ShabbatEvent[] {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as ShabbatEvent[];
}

function writeData(data: ShabbatEvent[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAll(): ShabbatEvent[] {
  return readData().sort((a, b) => a.gregorianDate.localeCompare(b.gregorianDate));
}

export function getById(id: string): ShabbatEvent | undefined {
  return readData().find(s => s.id === id);
}

export function create(data: Omit<ShabbatEvent, 'id' | 'createdAt' | 'updatedAt'>): ShabbatEvent {
  const all = readData();
  const now = new Date().toISOString();
  const event: ShabbatEvent = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  all.push(event);
  writeData(all);
  return event;
}

export function update(id: string, data: Partial<ShabbatEvent>): ShabbatEvent | null {
  const all = readData();
  const idx = all.findIndex(s => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, id, updatedAt: new Date().toISOString() };
  writeData(all);
  return all[idx];
}

export function bulkInsert(events: ShabbatEvent[]): void {
  const all = readData();
  writeData([...all, ...events]);
}

export function remove(id: string): boolean {
  const all = readData();
  const filtered = all.filter(s => s.id !== id);
  if (filtered.length === all.length) return false;
  writeData(filtered);
  return true;
}
