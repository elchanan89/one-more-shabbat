import * as fs from 'fs';
import * as path from 'path';

/**
 * Runtime data directory.
 * - Local/dev: backend/data
 * - Railway (or any host): set DATA_DIR to a mounted volume path (e.g. /data)
 *   so selections persist across deploys. Without a volume the dir is
 *   ephemeral and the app simply re-seeds on each boot.
 */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '../data');

/** Committed seed files (sibling of dist/ and src/, so the path holds in dev and prod). */
export const SEED_DIR = path.join(__dirname, '../seed');

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}
