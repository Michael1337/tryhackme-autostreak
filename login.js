import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cookiesPath = path.join(__dirname, 'cookies.json');

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();
  await page.goto(config.roomUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Log in manually, then press Enter to save cookies.');
  process.stdin.resume();
  await new Promise(resolve => process.stdin.once('data', resolve));

  const cookies = await page.cookies();
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2), 'utf8');

  console.log(`Saved ${cookies.length} cookies to ${cookiesPath}`);
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});