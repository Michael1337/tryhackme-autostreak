if tail -10 /var/log/cron.log | grep -q '{"success":true,"message":"Your answer is correct.","correct":true,"serverTime":"'"$(date '+%Y-%m-%d')"; then
    echo "✅ streak is alive"
else
    echo "🔴 streak is in danger, last: "$(tail -1 /var/log/cron.log)
fi