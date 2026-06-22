import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'public/favicon.svg',
  'public/icons.svg',
  'src/components/AntIcon.jsx',
  'src/components/SplashScreen.jsx',
  'src/components/LoadingScreen.jsx',
];

const missingFiles = requiredFiles.filter((file) => !existsSync(resolve(root, file)));

if (missingFiles.length > 0) {
  throw new Error(`Missing tracked branding files: ${missingFiles.join(', ')}`);
}

const appSource = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');

for (const importName of ['SplashScreen', 'LoadingScreen']) {
  if (!appSource.includes(importName)) {
    throw new Error(`App.jsx does not reference ${importName}`);
  }
}

const antIconSource = readFileSync(resolve(root, 'src/components/AntIcon.jsx'), 'utf8');

for (const expectedSvgPart of ['viewBox="0 0 24 24"', '<circle', '<ellipse', '<path']) {
  if (!antIconSource.includes(expectedSvgPart)) {
    throw new Error(`AntIcon.jsx is missing expected SVG part: ${expectedSvgPart}`);
  }
}

console.log('Tracked branding files verified.');
