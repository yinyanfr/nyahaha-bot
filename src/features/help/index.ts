import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const helpText = readFileSync(join(__dirname, 'help.txt')).toString();
