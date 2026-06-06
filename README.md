# TryHackMe Autostreak

This project runs a Puppeteer-based automation inside Docker and keeps the container alive with cron. The job runs twice a day at **02:30** and **14:30** using the container’s own scheduler.

## What it does

- Opens the TryHackMe `tickets3` room.
- Runs the reset flow.
- Submits the room check.
- Sends optional Gotify or Telegram notifications.
- Retries up to 5 times with a 30 second delay between attempts.
- Prevents overlapping runs with a lock file.

## Files

- `index.js` — main automation script.
- `login.js` — manual login helper that saves cookies.
- `config.js` — static settings for room URL, selectors, retry timing, and notifications.
- `notifications.js` — Gotify / Telegram notification helpers.
- `state.js` — stores run state so the second daily run can exit early if the streak was already secured.
- `run.sh` — lock wrapper to prevent overlapping runs.
- `crontab` — cron schedule for the container.
- `Dockerfile` — container image.
- `docker-compose.yml` — Compose setup for running the container.
- `cookies.json` — saved TryHackMe session cookies.

## Initial setup

### 1. Install dependencies locally

```bash
npm install
```

### 2. Log in once and save cookies

Run the login helper:

```bash
node login.js
```

A browser window will open. Log in manually to TryHackMe, then confirm in the terminal so the cookies are saved to `cookies.json`.

### 3. Test locally

```bash
node index.js
```

If the session is valid, the script should run the reset/check flow and print the API response.

## Docker Compose

Build and start the container:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

The Compose file mounts:

- `./cookies.json` into `/app/cookies.json`.
- `./logs` into `/var/log`.

## Scheduling inside the container

The container runs cron in the foreground. Cron executes `/app/run.sh` at:

- **02:30 daily**
- **14:30 daily**

`run.sh` uses `flock` so if one run is already active, the next scheduled run exits immediately instead of overlapping.

## Retry behavior

Each scheduled run retries the automation up to **5 times** with a **30 second** delay between attempts. This is intended to handle temporary failures without retrying forever.

## Overlap protection

Overlap is prevented in two ways:

1. `flock -n /tmp/tryhackme.lock` blocks concurrent runs.
2. The daily state file can be used so the second run exits early if the streak was already increased earlier that day.

## Notifications

Optional notification support is available for:

- Gotify.
- Telegram.

Notification text is based on the API response:

- If `isStreakIncreased` is `true`, the message says the streak is alive and includes the new streak number.
- If `isStreakIncreased` is `false`, the message warns that the streak is in danger.

The title includes the current date, for example:

- `TryHackMe (2026-06-01)`

## Refreshing login

If the session expires:

1. Stop the container.
2. Run `node login.js`.
3. Save the new `cookies.json`.
4. Start the container again:

```bash
docker compose up -d
```

## Logs

Cron output is written to the mounted `./logs` directory on the host.

Example:

```bash
tail -f ./logs/tryhackme.log
```

## Notes

- Keep `cookies.json` private.
- Do not commit cookies to version control.
- If the room UI changes, update the selectors in `config.js`.
- If the challenge page appears instead of the room, the current session or browser verification may need attention.