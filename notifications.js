import { config } from './config.js';

async function sendGotify(title, message, priority) {
  const { url, token } = config.notifications.gotify;
  if (!url || !token) return;
  await fetch(`${url.replace(/\/$/, '')}/message?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title, message, priority })
  });
}

async function sendTelegram(message) {
  const { botToken, chatId } = config.notifications.telegram;
  if (!botToken || !chatId) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true })
  });
}

export async function notify(title, message, priority) {
  if (!config.notifications.enabled) return;
  if (config.notifications.provider === 'gotify') return sendGotify(title, message, priority);
  if (config.notifications.provider === 'telegram') return sendTelegram(message);
}