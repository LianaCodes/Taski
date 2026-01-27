# n8n Simple Reminder Setup for Taski

## 1. Task Due Tomorrow Reminder

### Cron Trigger:
- Schedule: `0 18 * * *` (6 PM daily)
- Checks for tasks due tomorrow

### Email Template:
```
Subject: 📋 Task Due Tomorrow!

Hey there! 👋

Just a friendly reminder that your task "{{ $json.name }}" is due tomorrow.

You've got this! 💪

Best,
The Taski Team
```

## 2. Exam Reminders (3 schedules)

### A) One Week Before
- Schedule: Daily check at 9 AM
- Filter: exams in 7 days

```
Subject: 📚 Exam in One Week!

Hi! 😊

Your exam "{{ $json.name }}" is coming up in one week ({{ $json.date }}).

Time to start preparing! You can do this! 🌟

Happy studying,
The Taski Team
```

### B) Three Days Before
- Schedule: Daily check at 9 AM  
- Filter: exams in 3 days

```
Subject: ⏰ Exam in 3 Days!

Hello! 📖

Your exam "{{ $json.name }}" is this {{ $json.dayOfWeek }} ({{ $json.date }}).

Final push time! Review those notes! 🚀

You're almost there,
The Taski Team
```

### C) Night Before
- Schedule: `0 20 * * *` (8 PM daily)
- Filter: exams tomorrow

```
Subject: 🌙 Exam Tomorrow - You're Ready!

Hey champion! ✨

Your exam "{{ $json.name }}" is tomorrow. 

Get a good night's sleep - you've prepared well! 😴💤

Believe in yourself,
The Taski Team
```

## Quick Setup:
1. Install n8n: `npm install n8n -g`
2. Start: `n8n start`
3. Create 4 workflows with above templates
4. Connect to your email service (Gmail, etc.)
5. Set up API calls to fetch due tasks/exams