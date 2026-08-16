import fs from 'fs';
import path from 'path';

export interface SeededState {
  adminIdentifier: string;
  adminSecret: string;
  courseId: string;
  audioMaterialId: string;
  newsPostId: string;
  categoryId: string;
}

const STATE_PATH = path.join(__dirname, '..', '.state.json');

export function saveState(state: SeededState): void {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

export function loadState(): SeededState {
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}
