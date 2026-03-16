#!/bin/bash
LOG=/var/log/cron.log
today="$(date '+%Y-%m-%d')"

# Extract everything after the last DATE line for today
block="$(awk -v d="$today" '
  /^DATE: / && $2 ~ d { last = NR }
  { lines[NR] = $0 }
  END {
    for (i = last + 1; i <= NR; i++) {
      if (lines[i] != "") print lines[i]
    }
  }
' "$LOG")"

# If no block for today, assume danger
if [ -z "$block" ]; then
  echo "🔴 streak is in danger, last: $(tail -n 1 "$LOG")"
  exit 0
fi

# Take only the last two JSON‑like lines from today
last_two="$(echo "$block" | tail -n 2)"

if echo "$last_two" | grep -q '"isCorrect":true,"isStreakIncreased":true'; then
    # First call of the day succeeded and increased streak
    echo "✅ streak is alive"
elif echo "$last_two" | grep -q '"isCorrect":true'; then
    # At least one of the last two calls was correct (either first or second)
    echo "✅ streak is alive"
else
    # Both last calls were incorrect
    echo "🔴 streak is in danger, last: $(echo "$last_two" | tail -n 1)"
fi
