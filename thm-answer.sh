#!/bin/bash
curl 'https://tryhackme.com/api/tickets3/answer' \

	# your fetch data here; don't forget the backslash \

  --compressed \
  --silent \
  --show-error \
  | xargs -0 echo >> /var/log/cron.log 2>&1
  