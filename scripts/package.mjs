/**
 * Assemble a platform-specific distributable:
 *   node scripts/package.mjs tizen  -> dist-tizen/  (dist + tizen/config.xml, icon)
 *   node scripts/package.mjs webos  -> dist-webos/  (dist + webos/appinfo.json, icons)
 *
 * The output folder is what the platform packager consumes:
 *   Tizen:  tizen package -t wgt -- dist-tizen
 *   webOS:  ares-package dist-webos
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const platform = process.argv[2];

if (platform !== 'tizen' && platform !== 'webos') {
  console.error('Usage: node scripts/package.mjs <tizen|webos>');
  process.exit(1);
}

const distDir = join(rootDir, 'dist');
const platformDir = join(rootDir, platform);
const outDir = join(rootDir, `dist-${platform}`);

if (!existsSync(distDir)) {
  console.error('dist/ not found. Run "npm run build" first.');
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// 1. Web build output.
cpSync(distDir, outDir, { recursive: true });

// 2. Platform descriptor files (config.xml / appinfo.json, icons, ...).
for (const entry of readdirSync(platformDir)) {
  if (entry === '.gitkeep' || entry === '.DS_Store') continue;
  cpSync(join(platformDir, entry), join(outDir, entry), { recursive: true });
}

console.log(`Packaged ${platform} app into ${outDir}`);
