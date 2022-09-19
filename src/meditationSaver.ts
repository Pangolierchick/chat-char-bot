import {Meditation} from './types';
import fsp from 'fs/promises';
import fs from 'fs';

const meditationsBuffer: Meditation[] = [];
const SAVE_FILENAME = 'meditations.json';

export async function meditationSaverCallback(meditation: Meditation) {
  meditationsBuffer.push(meditation);
  let readMed: Meditation[];
  if (fs.existsSync(SAVE_FILENAME)) {
    readMed = await loadMeditations();
    readMed = readMed.concat(meditationsBuffer);
  } else {
    readMed = meditationsBuffer;
  }

  await saveMeditations(readMed);
  meditationsBuffer.pop();
}

export async function saveMeditations(meditations: Meditation[]) {
  await fsp.writeFile(SAVE_FILENAME, JSON.stringify(meditations));
}

export async function loadMeditations() {
  return JSON.parse(await fsp.readFile(SAVE_FILENAME, {encoding: 'utf-8'})) as Meditation[];
}
