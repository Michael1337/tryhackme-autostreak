#!/bin/bash
set -e

MESSAGE="$('/app/get-log.sh')"
PRIORITY=8
if echo "$MESSAGE" | grep -q 'streak is alive'; then
  PRIORITY=2
fi

curl -sS -X POST "https://gotify.yourdomain.tld/message?token=YourAppToken" \
  -F "title=TryHackMe ($(date '+%Y-%m-%d'))" \
  -F "message=$MESSAGE" \
  -F "priority=$PRIORITY" \
  >> /var/log/cron.log 2>&1