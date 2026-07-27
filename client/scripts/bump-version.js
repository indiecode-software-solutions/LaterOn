import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gradlePath = join(__dirname, '..', 'android', 'app', 'build.gradle');

let gradle = readFileSync(gradlePath, 'utf-8');

const commitCount = execSync('git rev-list --count HEAD', { encoding: 'utf-8' }).trim();
const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
const date = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

const versionCode = parseInt(commitCount, 10);
const versionName = `${date}-${shortHash}`;

gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName "[^"]+"/, `versionName "${versionName}"`);

writeFileSync(gradlePath, gradle, 'utf-8');

console.log(`Bumped to versionCode=${versionCode}, versionName=${versionName}`);
