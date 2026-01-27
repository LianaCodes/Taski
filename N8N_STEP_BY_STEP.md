# Step-by-Step n8n Setup Guide

## 1. Task Due Tomorrow Workflow

### Step 1: Create New Workflow
- Go to your n8n dashboard
- Click "New Workflow"
- Name it "Task Due Tomorrow Reminder"

### Step 2: Add Cron Trigger
- Add node → Trigger → Cron
- Set expression: `0 18 * * *` (6 PM daily)

### Step 3: Add HTTP Request
- Add node → Regular → HTTP Request
- Method: GET
- URL: `http://your-taski-domain.com/api/tasks/due-tomorrow`
- Headers: `Content-Type: application/json`

### Step 4: Add IF Node (Check if tasks exist)
- Add node → Logic → IF
- Condition: `{{ $json.length > 0 }}`

### Step 5: Add Email Node
- Add node → Regular → Email (Gmail/SMTP)
- To: `{{ $json[0].userId.email }}`
- Subject: `📋 Task Due Tomorrow!`
- Body: 
```
Hey there! 👋

Just a friendly reminder that your task "{{ $json[0].name }}" is due tomorrow.

You've got this! 💪

Best,
The Taski Team
```

## 2. Exam 1 Week Reminder

### Repeat above steps but change:
- Cron: `0 9 * * *` (9 AM daily)
- URL: `http://your-taski-domain.com/api/exams-upcoming/7`
- Subject: `📚 Exam in One Week!`
- Body: Use the 1-week template from N8N_SETUP.md

## 3. Exam 3 Days Reminder

### Same setup, change:
- URL: `http://your-taski-domain.com/api/exams-upcoming/3`
- Subject: `⏰ Exam in 3 Days!`
- Body: Use the 3-days template

## 4. Exam Night Before

### Same setup, change:
- Cron: `0 20 * * *` (8 PM daily)
- URL: `http://your-taski-domain.com/api/exams-upcoming/1`
- Subject: `🌙 Exam Tomorrow - You're Ready!`
- Body: Use the night-before template

## Email Setup:
- Use Gmail node or SMTP
- Configure your email credentials in n8n settings
- Test each workflow before activating

## Activate All 4 Workflows
- Click "Active" toggle on each workflow
- Monitor execution logs for errors