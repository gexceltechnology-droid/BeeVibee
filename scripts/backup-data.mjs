import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');
const backupsDir = path.join(dataDir, 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-');

const dbPath = path.join(dataDir, 'db.json');
const archivePath = path.join(dataDir, 'archive_db.json');

const results = [];

if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, 'utf8');
  const parsed = JSON.parse(content);
  const backupFile = path.join(backupsDir, `db_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, content, 'utf8');
  const stat = fs.statSync(backupFile);
  results.push({
    source: 'data/db.json',
    backup: `data/backups/db_backup_${timestamp}.json`,
    sizeBytes: stat.size,
    bookingsCount: parsed.bookings?.length || 0,
    timeSlotsCount: parsed.timeSlots?.length || 0,
    menuItemsCount: parsed.menuItems?.length || 0,
  });
}

if (fs.existsSync(archivePath)) {
  const content = fs.readFileSync(archivePath, 'utf8');
  const backupFile = path.join(backupsDir, `archive_backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, content, 'utf8');
  const stat = fs.statSync(backupFile);
  results.push({
    source: 'data/archive_db.json',
    backup: `data/backups/archive_backup_${timestamp}.json`,
    sizeBytes: stat.size,
  });
}

console.log(JSON.stringify({ success: true, timestamp, results }, null, 2));
