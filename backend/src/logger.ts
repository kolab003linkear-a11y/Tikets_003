import fs from 'fs';
import path from 'path';

const logDirectory = path.resolve(__dirname, '../logs');
const logFile = path.join(logDirectory, 'app.log');

export function writeLog(level: 'INFO' | 'ERROR', message: string, details?: unknown) {
  fs.mkdirSync(logDirectory, { recursive: true });
  const suffix = details === undefined ? '' : ` ${serialize(details)}`;
  const line = `${new Date().toISOString()} [${level}] ${message}${suffix}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
}

function serialize(value: unknown) {
  if (value instanceof Error) {
    return JSON.stringify({ name: value.name, message: value.message, stack: value.stack });
  }

  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ value: String(value) });
  }
}
