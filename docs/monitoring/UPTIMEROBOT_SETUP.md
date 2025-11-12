# UptimeRobot Setup Guide

Complete guide to configure uptime monitoring with UptimeRobot (free tier).

---

## Step 1: Create UptimeRobot Account

1. Go to https://uptimerobot.com/signUp
2. Sign up with email (or GitHub/Google)
3. Verify your email
4. Login to dashboard

**Free Tier Includes:**
- 50 monitors
- 5-minute check intervals
- Email alerts
- 2-month logs
- Public status pages

---

## Step 2: Configure Monitors

### Monitor 1: Main Application

**Purpose:** Verify the application is accessible and responding

1. Click **+ Add New Monitor**
2. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `FocusOnIt - Main App`
   - **URL (or IP):** `https://focusonit.ycm360.com/login`
   - **Monitoring Interval:** `5 minutes`
   - **Monitor Timeout:** `30 seconds`

3. Advanced Settings:
   - **HTTP Method:** GET
   - **Expected Status Code:** `200`
   - **Keyword Check:**
     - Keyword Exists: Yes
     - Keyword: `FocusOnIt` (verifies page loaded correctly)
   - **Follow Redirects:** Yes (3xx codes)

4. Click **Create Monitor**

---

### Monitor 2: API Health Check

**Purpose:** Verify backend services are operational

1. Click **+ Add New Monitor**
2. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `FocusOnIt - API Health`
   - **URL (or IP):** `https://focusonit.ycm360.com/api/health`
   - **Monitoring Interval:** `5 minutes`
   - **Monitor Timeout:** `30 seconds`

3. Advanced Settings:
   - **HTTP Method:** GET
   - **Expected Status Code:** `200`
   - **Keyword Check:**
     - Keyword Exists: Yes
     - Keyword: `"status":"healthy"` (exact match from JSON response)
   - **Custom HTTP Headers:** (optional)
     ```
     User-Agent: UptimeRobot/1.0
     ```

4. Click **Create Monitor**

---

### Monitor 3: Supabase Database (Optional)

**Purpose:** Direct check of Supabase availability

1. Click **+ Add New Monitor**
2. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `FocusOnIt - Supabase`
   - **URL (or IP):** `https://[your-project].supabase.co/rest/v1/`
   - **Monitoring Interval:** `5 minutes`
   - **Monitor Timeout:** `30 seconds`

3. Advanced Settings:
   - **HTTP Method:** GET
   - **Custom HTTP Headers:**
     ```
     apikey: [your-anon-key]
     Authorization: Bearer [your-anon-key]
     ```
   - **Expected Status Code:** `200` or `404` (both mean service is up)

4. Click **Create Monitor**

**Note:** Get your Supabase URL from your `.env.local` file (`NEXT_PUBLIC_SUPABASE_URL`)

---

## Step 3: Configure Alert Contacts

### Email Alerts (Free)

1. Go to **My Settings** → **Alert Contacts**
2. Your signup email is automatically added
3. To add more emails:
   - Click **Add Alert Contact**
   - Choose **E-mail**
   - Enter email address
   - Choose threshold: `0` (alert immediately on down)
   - Click **Create Alert Contact**

---

### Telegram Bot Alerts (Recommended - Free)

**Setup Telegram Bot:**

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions:
   - Bot name: `FocusOnIt Monitor Bot`
   - Username: `focusonit_monitor_bot` (must end in _bot)
4. Copy the **bot token** (looks like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

**Get Your Chat ID:**

1. Search for `@userinfobot` in Telegram
2. Send `/start`
3. Copy your **Chat ID** (looks like: `123456789`)

**Configure Webhook in UptimeRobot:**

1. Go to **My Settings** → **Alert Contacts**
2. Click **Add Alert Contact**
3. Choose **Webhook**
4. Configure:
   - **Friendly Name:** `Telegram Alert`
   - **URL to Notify:**
     ```
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage
     ```
     Replace `<YOUR_BOT_TOKEN>` with your bot token from BotFather

   - **HTTP Method:** POST
   - **POST Value:**
     ```json
     {
       "chat_id": "<YOUR_CHAT_ID>",
       "text": "🔴 *ALERT*\n\n*Monitor:* *monitorFriendlyName*\n*Status:* *monitorAlertType*\n*URL:* *monitorURL*\n*Time:* *monitorAlertDateTime*",
       "parse_mode": "Markdown"
     }
     ```
     Replace `<YOUR_CHAT_ID>` with your chat ID from @userinfobot

   - **Alert When:** `Down` and `Up` (get notifications for both)

5. Click **Create Alert Contact**

**Test Your Telegram Alert:**

1. Click the **Test** button next to your Telegram webhook
2. You should receive a test message in Telegram
3. If not, verify bot token and chat ID are correct

---

### SMS Alerts (Paid - Optional)

**Cost:** $1 per 10 SMS credits

1. Go to **My Settings** → **Alert Contacts**
2. Click **Add Alert Contact**
3. Choose **SMS**
4. Enter your phone number with country code (e.g., `+1234567890`)
5. Verify phone number via SMS code
6. Configure alert threshold (recommend: alert on every downtime)
7. Purchase SMS credits: Settings → Billing

**When to use SMS:**
- Critical production outages only
- After-hours on-call alerts
- Backup notification method

---

## Step 4: Alert Rules & Thresholds

### Configure Alert Settings Per Monitor

For each monitor:

1. Click monitor name → **Edit**
2. Scroll to **Alert Contacts To Notify**
3. Select alert contacts:
   - **Email:** Yes (all monitors)
   - **Telegram:** Yes (all monitors)
   - **SMS:** Only for critical monitors (Main App + API Health)

4. Configure thresholds:
   - **When to alert:** `When down`
   - **Alert when down for:** `5 minutes` (2 consecutive checks)
   - **Alert when up again:** `Yes` (recovery notification)

5. Click **Save Changes**

---

### Recommended Alert Configuration

| Monitor | Email | Telegram | SMS | Threshold |
|---------|-------|----------|-----|-----------|
| Main App | Yes | Yes | Yes | 5 min (critical) |
| API Health | Yes | Yes | Yes | 5 min (critical) |
| Supabase | Yes | Yes | No | 10 min (warning) |

---

## Step 5: SSL Certificate Monitoring

**Enable SSL expiry alerts:**

1. Edit each HTTPS monitor
2. Scroll to **Advanced Settings**
3. Enable **SSL Monitoring**
4. Set **Alert X days before expiration:** `7 days`
5. Select alert contacts
6. Click **Save Changes**

**Note:** Vercel automatically renews SSL certificates, but good to monitor as backup.

---

## Step 6: Public Status Page (Optional)

**Create a public status page for users:**

1. Go to **Status Pages** (top menu)
2. Click **Add New Status Page**
3. Configure:
   - **Friendly Name:** `FocusOnIt Status`
   - **Monitors to Show:**
     - FocusOnIt - Main App
     - FocusOnIt - API Health
   - **Custom Domain:** (optional) `status.focusonit.ycm360.com`
   - **Design:** Choose theme

4. Click **Create Status Page**

**Share status page:**
- URL: `https://stats.uptimerobot.com/[your-page-id]`
- Embed in footer: "System Status"
- Share during incidents

---

## Step 7: Maintenance Windows

**Schedule maintenance to prevent false alerts:**

1. Go to **Maintenance Windows**
2. Click **Add New Maintenance**
3. Configure:
   - **Friendly Name:** `Planned Deployment`
   - **Type:** `Once` or `Recurring`
   - **Duration:** `30 minutes` (typical deployment time)
   - **Monitors to Pause:** Select all

4. Click **Create Maintenance**

**Best Practice:** Schedule maintenance windows during:
- Deployments
- Database migrations
- Infrastructure upgrades

---

## Step 8: Integration with Incident Response

### Alert Response Workflow

**When alert fires:**

1. **Telegram/Email received** → Check alert details
2. **Open Sentry** → Check for error spikes
3. **Visit health check** → `https://focusonit.ycm360.com/api/health`
4. **Check Vercel dashboard** → Deployment status
5. **Diagnose issue** → Follow runbook (see INCIDENT_RESPONSE_RUNBOOK.md)
6. **Fix issue** → Deploy fix or rollback
7. **Verify recovery** → Wait for UP notification

---

## Step 9: Testing

**Test monitors work correctly:**

1. **Main App Monitor:**
   ```bash
   # Temporarily break the app (in staging, not production!)
   # Or use UptimeRobot's "Pause" feature to simulate downtime
   ```

2. **API Health Monitor:**
   ```bash
   # Test the endpoint manually
   curl https://focusonit.ycm360.com/api/health

   # Should return: {"status":"healthy", ...}
   ```

3. **Alert Contacts:**
   - Use "Test" button next to each contact
   - Verify you receive test notifications
   - Check spam folder if email doesn't arrive

---

## Monitoring Dashboard

### View Monitor Status

**Dashboard Overview:**
- Green: Up and running
- Red: Down (alert sent)
- Yellow: Paused (maintenance)
- Gray: Not checked yet

**Response Time Graph:**
- Monitor response times over 24h/7d/30d
- Identify performance degradation trends
- Typical response times:
  - Main App: 200-500ms
  - API Health: 100-300ms
  - Supabase: 50-150ms

---

## Upgrade Considerations

### When to Upgrade to Pro ($7/month)

Upgrade if you need:
- **1-minute check intervals** (instead of 5-minute)
- **SMS alerts included** (10 SMS/month)
- **6-month logs** (instead of 2-month)
- **Advanced statistics**
- **White-label status pages**

### Alternative: BetterStack (formerly Uptime Robot competitor)

If you outgrow UptimeRobot:
- More detailed analytics
- Incident management
- On-call scheduling
- Team collaboration

**Cost:** $20/month (after free trial)

---

## Troubleshooting

### Monitor Shows Down But Site Works

**Possible causes:**
1. **Firewall blocking UptimeRobot IPs**
   - Whitelist UptimeRobot IPs (see their docs)

2. **Keyword check failing**
   - Verify keyword exists in response
   - Check for typos in keyword

3. **Timeout too aggressive**
   - Increase timeout to 60 seconds
   - Check actual response time in monitor logs

---

### Not Receiving Alerts

**Check:**
1. **Alert contact verified?**
   - Go to My Settings → Alert Contacts
   - Resend verification email if needed

2. **Alert threshold configured?**
   - Edit monitor → Check "Alert Contacts To Notify"
   - Verify contacts are selected

3. **Email in spam?**
   - Check spam folder
   - Add `noreply@uptimerobot.com` to contacts

4. **Telegram bot blocked?**
   - Send `/start` to your bot in Telegram
   - Verify chat ID is correct

---

### Monitor Timeout Issues

**If monitors frequently timeout:**

1. **Increase timeout:** 30s → 60s
2. **Check Vercel function timeout:**
   - Hobby tier: 10s max
   - Pro tier: 60s max
3. **Optimize health check query**
   - Reduce database queries
   - Use caching (carefully - don't cache errors)

---

## Maintenance

### Weekly Tasks

- [ ] Review monitor status (all green?)
- [ ] Check response time trends (degrading?)
- [ ] Verify alerts are being received

### Monthly Tasks

- [ ] Review incident history
- [ ] Update runbook based on incidents
- [ ] Test alert contacts
- [ ] Review and adjust thresholds

### Quarterly Tasks

- [ ] Audit monitors (remove unused)
- [ ] Review upgrade needs
- [ ] Update documentation
- [ ] Test disaster recovery

---

## Resources

- UptimeRobot Documentation: https://uptimerobot.com/help
- Status Code Reference: https://httpstatuses.com/
- Telegram Bot API: https://core.telegram.org/bots/api

---

**Created:** 2025-11-11
**Last Updated:** 2025-11-11
**Owner:** DevOps Team
