import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { notify } from './notifications.js';
import { readState, writeState } from './state.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cookiesPath = path.join(__dirname, 'cookies.json');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const today = new Date().toISOString().slice(0, 10);

function buildNotification(result) {
  const title = `TryHackMe (${today})`;

  if (result?.isStreakIncreased) {
    return {
      title,
      message: `✅ streak is alive and increased to ${result.currentStreak}`,
      priority: 1
    };
  }

  if (typeof result?.currentStreak === 'number') {
    return {
      title,
      message: `⚠️ streak is in danger, current streak is ${result.currentStreak}`,
      priority: 10
    };
  }

  return {
    title,
    message: '⚠️ streak is in danger',
    priority: 10
  };
}

/**
 * Clicks the first visible element whose text exactly matches the given label.
 * Returns true if a click happened, otherwise false.
 */
async function clickByText(page, text, containerSelector = 'body') {
  await page.waitForSelector(containerSelector, { timeout: 3000 });

  const target = await page.evaluateHandle(({ text, containerSelector }) => {
    const root = document.querySelector(containerSelector);
    if (!root) return null;

    const isVisible = el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && style.opacity !== '0'
        && rect.width > 0
        && rect.height > 0;
    };

    const candidates = [...root.querySelectorAll('button, [role="button"], [role="menuitem"], a, span, div')]
      .filter(isVisible)
      .filter(el => (el.innerText || el.textContent || '').trim() === text);

    return candidates[0] || null;
  }, { text, containerSelector });

  const el = target.asElement();
  if (!el) {
    console.log(`clickByText("${text}") => not found`);
    return false;
  }

  const box = await el.boundingBox();
  if (!box) {
    console.log(`clickByText("${text}") => no bounding box`);
    return false;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();

  console.log(`clickByText("${text}") => clicked`);
  return true;
}

/**
 * Runs one complete browser attempt:
 * loads cookies, opens the room, resets progress, checks the answer,
 * sends notifications, and updates state.
 */
async function runOnce() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });

  try {
    const page = await browser.newPage();

    const cookies = JSON.parse(await fs.readFile(cookiesPath, 'utf8'));
    await page.setCookie(...cookies);

    await page.goto(config.roomUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(config.waitAfterPageLoadMs);

    const hasOptions = await page
      .$eval('body', root => (root.innerText || root.textContent || '').includes('Options'))
      .catch(() => false);

    if (!hasOptions) {
      console.log('Options not present. Will retry after restart.');
      return false;
    }

    await sleep(config.waitBeforeResetMs);

    if (!(await clickByText(page, 'Options'))) return false;

    await page.waitForFunction(
      () => [...document.querySelectorAll('body *')]
        .some(el => (el.innerText || el.textContent || '').trim() === 'Reset Progress'),
      { timeout: 10000 }
    ).catch(() => false);

    if (!(await clickByText(page, 'Reset Progress'))) return false;

    await page.waitForFunction(
      () => [...document.querySelectorAll('body *')]
        .some(el => (el.innerText || el.textContent || '').trim() === 'Yes, reset my progress'),
      { timeout: 10000 }
    ).catch(() => false);

    if (!(await clickByText(page, 'Yes, reset my progress'))) return false;

    await sleep(config.waitAfterResetMs);
    await page.waitForSelector(config.selectors.taskContainer, { timeout: 10000 });

    const responsePromise = page.waitForResponse(
      r => r.url().includes('/api/v2/rooms/answer'),
      { timeout: 30000 }
    );

    await page.click(config.selectors.checkButton);

    const response = await responsePromise;
    const rawText = await response.text();

    console.log(JSON.stringify({
      ok: response.ok(),
      status: response.status(),
      url: response.url(),
      text: rawText
    }, null, 2));

    let parsed = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = null;
    }

    const data = parsed?.data || {};
    const { title, message, priority } = buildNotification(data);

    await notify(title, message, priority);

    await writeState({
      lastSuccessDate: today,
      lastRunSucceeded: Boolean(data.isStreakIncreased),
      currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : null
    });

    return true;
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * Retries the full run up to five times, waiting 30 seconds between failures.
 * Exits early if today's streak has already been successfully saved.
 */
async function main() {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const state = await readState().catch(() => ({}));

    if (state.lastSuccessDate === today && state.lastRunSucceeded) {
      console.log('Streak already saved today, skipping this run.');
      return;
    }

    const ok = await runOnce().catch(err => {
      console.error(`Attempt ${attempt} failed:`, err);
      return false;
    });

    if (ok) return;

    if (attempt < 5) {
      console.log(`Retrying in 30 seconds... (${attempt}/5)`);
      await sleep(30_000);
    }
  }

  throw new Error('All 5 attempts failed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});