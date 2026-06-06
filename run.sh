#!/bin/sh
set -eu

exec flock -n /tmp/tryhackme.lock node /app/index.js