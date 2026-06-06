import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statePath = path.join(__dirname, 'state.json');

export async function readState() {
  try {
    return JSON.parse(await fs.readFile(statePath, 'utf8'));
  } catch {
    return {};
  }
}

export async function writeState(state) {
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function getStatePath() {
  return statePath;
}