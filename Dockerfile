FROM ubuntu:20.04

RUN apt-get update && apt-get install -y cron && apt-get install -y curl

# Add bash scripts
COPY thm-answer.sh /app/
RUN chmod +x /app/thm-answer.sh
COPY thm-reset.sh /app/
RUN chmod +x /app/thm-reset.sh
COPY get-log.sh /app/
RUN chmod +x /app/get-log.sh

# Configure the cron
# Copy file to the cron.d directory
COPY cron /etc/cron.d/cron

# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/cron

# Apply cron job
RUN crontab /etc/cron.d/cron

# Create the log file to be able to run tail
RUN touch /var/log/cron.log

# Start the cron
CMD cron && tail -f /var/log/cron.log
