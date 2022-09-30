# tryhackme-autostreak
A dockerized bash script to automatically keep your streak on TryHackMe alive.
Log into your https://tryhackme.com/ account, go to any room that has an answer with no value, e.g. https://tryhackme.com/room/tickets3 and get two fetch requests:
- one for answering a question
- another one for resetting the progress in that room.

You can use Google Chrome, open the developer tools (F12), switch to the network tab, select only Fetch/XHR, check "Preserve log" and then 
- click on "Completed" to get the "answer" request
- click on "Reset Progress" and confirm the warning to get the "reset-progress" request

For both of them, you want to "Copy as cURL (bash)".

Then, insert your fetch request into the .sh scripts. I left parts of the scripts there so you know you go the correct ones. Notice the ">> /var/log/cron.log 2>&1" at the end. That's to save the bash output to a log file to review them later in case something doesn't work. The log file is cleared once a week.

I configured the cronjobs to run twice a day, just in case something is not working at one of the two times.

Also, if you use gotify (https://gotify.net/), you can uncomment the third line in the cron file and adjust the domain and token to get the last line of your logs messaged to you. That will usually include the timestamp of your latest correct answer, so you can easily see if it is still up-to-date.

To build the docker image:

```bash
docker build -t thm_streak .
```

And to run the container:

```bash
docker run -d --name=thm_streak --restart=unless-stopped thm_streak
```

In case you want to see the logs:

```bash
docker exec -it thm_streak bash
```

The logs are in /var/log/cron.log. You could also create a volume of course.

Obviously you don't have to use docker. In that case, just copy the contents of "cron" into your crontab file and adjust the paths to the .sh scripts according to where you place the files.
