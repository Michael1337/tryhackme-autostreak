FROM ghcr.io/puppeteer/puppeteer:latest

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends cron util-linux \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

COPY crontab /etc/cron.d/tryhackme-cron
RUN chmod 0644 /etc/cron.d/tryhackme-cron \
  && crontab /etc/cron.d/tryhackme-cron \
  && chmod +x /app/run.sh \
  && mkdir -p /var/log

USER pptruser

CMD ["cron", "-f"]