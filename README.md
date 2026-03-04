# 🐜 Ant Colony — Telegram Bot Setup Guide

## What You Get
- `bot.js` — Telegram bot server (handles commands, referrals, wallet)
- `miniapp.html` — The full Ant Colony game (runs inside Telegram)

---

## Step 1: Create Your Bot via @BotFather

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Enter bot name: `Ant Colony`
4. Enter username: `AntColonyBot` (must end in "bot")
5. Copy your **BOT_TOKEN** — looks like: `7123456789:AAGXxxx...`

---

## Step 2: Deploy the Mini App

The `miniapp.html` must be hosted on **HTTPS**. Free options:

### Option A: GitHub Pages (FREE, easiest)
1. Create GitHub repo → upload `miniapp.html`
2. Go to Settings → Pages → Deploy from main branch
3. Your URL: `https://yourusername.github.io/antcolony/miniapp.html`

### Option B: Netlify (FREE, drag & drop)
1. Go to https://netlify.com → drag your `miniapp.html` file
2. Get instant HTTPS URL like: `https://antcolony.netlify.app`

### Option C: Vercel (FREE)
```bash
npm install -g vercel
vercel --prod
```

---

## Step 3: Configure the Bot

Edit `bot.js` (lines 12-13):
```js
const BOT_TOKEN    = 'YOUR_BOT_TOKEN_HERE';   // from BotFather
const MINI_APP_URL = 'https://your-domain.com/miniapp.html'; // your deployed URL
```

Also update `miniapp.html` (line ~190):
```js
let BOT_USERNAME = 'AntColonyBot'; // your actual bot username
```

---

## Step 4: Register the Mini App with BotFather

1. In BotFather: `/newapp`
2. Select your bot → follow prompts
3. Set Web App URL to your `miniapp.html` URL

OR add a Menu Button:
1. In BotFather: `/setmenubutton`
2. Select your bot
3. Enter URL: `https://your-domain.com/miniapp.html`
4. Button text: `🐜 Play Ant Colony`

---

## Step 5: Run the Bot

```bash
npm install
node bot.js
```

For production (keeps it running):
```bash
npm install -g pm2
pm2 start bot.js --name "AntColony"
pm2 save
```

---

## Bot Commands (auto-set via BotFather `/setcommands`)

```
start - Open Ant Colony game
stats - View your colony stats
wallet - Check your $ANT balance
claim - Claim daily reward
invite - Get your recruit link
leaderboard - Top colonies worldwide
help - Show all commands
```

---

## How the Referral System Works

1. User A gets link: `t.me/AntColonyBot?start=ref_12345678`
2. User B clicks it → opens bot → joins
3. **Instantly**: User A gets +5 Workers + 0.1 $ANT bonus
4. User B's workers mine $ANT for User A forever

---

## Hosting the Bot Server (Free Options)

| Platform | Free Tier | Notes |
|---|---|---|
| **Railway** | 500hrs/month | Easy deploy |
| **Render** | Always-on free | May sleep |
| **Fly.io** | Free tier | Fast |
| **VPS** | ~$4/month | Best for production |

### Deploy to Railway (easiest):
1. https://railway.app → New Project → Deploy from GitHub
2. Add env variable: `BOT_TOKEN=your_token`
3. Done — runs 24/7!

---

## Production Notes

- **Database**: Replace the `Map()` in bot.js with MongoDB/Firebase for persistence
- **Anti-cheat**: Add server-side balance verification
- **Scale**: Use webhooks instead of polling for better performance

```js
// Switch to webhook mode (production):
bot.launch({ webhook: { domain: 'your-domain.com', port: 3000 } });
```
