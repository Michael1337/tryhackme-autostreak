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

last_two="$(echo "$block" | tail -n 2)"

# Try to get the streak from the last success line
if echo "$last_two" | grep -q '"isCorrect":true'; then
  # Use grep + sed to extract currentStreak
  streak="$(echo "$last_two" | grep '"currentStreak":' | sed -n 's/.*"currentStreak":[ ]*\([0-9]*\).*/\1/p' | tail -n 1)"
  if [ -n "$streak" ]; then
    if echo "$last_two" | grep -q '"isStreakIncreased":true'; then
      echo "✅ streak is alive and increased to $streak"
    else
      echo "✅ streak is alive at $streak"
    fi
  else
    echo "✅ streak is alive (streak lookup failed)"
  fi
else
  echo "🔴 streak is in danger, last: $(echo "$last_two" | tail -n 1)"
fi
