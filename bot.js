/**
 * 🐜 ANT COLONY — Telegram Bot
 * ================================
 * Framework: Telegraf v4
 * Mini App URL: Set your deployed miniapp URL in MINI_APP_URL
 * 
 * Setup:
 *   1. Create a bot via @BotFather on Telegram
 *   2. Get your BOT_TOKEN
 *   3. Deploy miniapp.html to a HTTPS server (Vercel, Netlify, GitHub Pages)
 *   4. Set MINI_APP_URL to your deployed URL
 *   5. Run: node bot.js
 */

const { Telegraf, Markup, session } = require('telegraf');

// ─────────────────────────────────────────────────
//  CONFIG — Replace these before running
// ─────────────────────────────────────────────────
const BOT_TOKEN   = process.env.BOT_TOKEN   || 'YOUR_BOT_TOKEN_HERE';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://your-domain.com/antcolony';

// ─────────────────────────────────────────────────
//  In-memory DB (replace with MongoDB/Firebase for production)
// ─────────────────────────────────────────────────
const users = new Map();

function getUser(id, username, firstName) {
  if (!users.has(id)) {
    users.set(id, {
      id,
      username: username || 'AntPlayer',
      firstName: firstName || 'Player',
      balance: 0,
      totalMined: 0,
      colonySize: 5,
      referrals: [],
      referredBy: null,
      joinedAt: Date.now(),
      lastClaim: 0,
      workers: { scout: 5, soldier: 0, carrier: 2, queen: 0 },
      rank: Math.floor(Math.random() * 500) + 100,
    });
  }
  return users.get(id);
}

function fmt(n, d = 2) { return Number(n).toFixed(d); }
function fmtK(n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n); }

function getTierName(size) {
  if (size >= 20000) return '👑 Legendary Hive';
  if (size >= 5000)  return '🌍 Mega Empire';
  if (size >= 1000)  return '🏰 Grand Fortress';
  if (size >= 400)   return '⚔️ Soldier Garrison';
  if (size >= 150)   return '🏘️ Worker Village';
  if (size >= 50)    return '🏕️ Scout Colony';
  if (size >= 10)    return '🐛 Larva Den';
  return '🥚 Egg Chamber';
}

// ─────────────────────────────────────────────────
//  BOT INIT
// ─────────────────────────────────────────────────
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

// ─────────────────────────────────────────────────
//  /start  — Welcome & referral handling
// ─────────────────────────────────────────────────
bot.start(async (ctx) => {
  const userId   = ctx.from.id;
  const username = ctx.from.username;
  const firstName = ctx.from.first_name || 'Miner';

  const user = getUser(userId, username, firstName);

  // Handle referral: /start ref_12345678
  const payload = ctx.startPayload;
  if (payload && payload.startsWith('ref_')) {
    const referrerId = parseInt(payload.replace('ref_', ''));
    if (referrerId !== userId && !user.referredBy && users.has(referrerId)) {
      user.referredBy = referrerId;
      const referrer = users.get(referrerId);
      referrer.referrals.push(userId);
      referrer.colonySize += 5;
      referrer.workers.scout += 5;
      referrer.balance += 0.1;

      // Notify referrer
      try {
        await ctx.telegram.sendMessage(referrerId,
          `🐜 *New Recruit Joined Your Colony!*\n\n` +
          `👤 *${firstName}* has joined using your invite link!\n` +
          `✅ *+5 Worker Ants* added to your colony\n` +
          `💰 *+0.1 $ANT* bonus credited\n\n` +
          `Your colony now has *${referrer.colonySize}* workers!`,
          { parse_mode: 'Markdown' }
        );
      } catch (e) { /* referrer may have blocked bot */ }
    }
  }

  const welcomeText =
    `🐜 *Welcome to Ant Colony, ${firstName}!*\n\n` +
    `Build the most powerful underground empire and mine *$ANT* tokens!\n\n` +
    `🏰 *Your Colony:* ${getTierName(user.colonySize)}\n` +
    `🐜 *Workers:* ${fmtK(user.colonySize)}\n` +
    `💰 *Balance:* ${fmt(user.balance, 3)} $ANT\n\n` +
    `Tap the button below to open your colony! 👇`;

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🐜 Open Ant Colony', `${MINI_APP_URL}?user=${userId}&ref=${ctx.from.username || userId}`)],
      [
        Markup.button.callback('📊 My Stats',  'stats'),
        Markup.button.callback('👥 Invite',    'invite'),
      ],
      [
        Markup.button.callback('🏆 Leaderboard', 'leaderboard'),
        Markup.button.callback('💰 Wallet',       'wallet'),
      ],
    ])
  });
});

// ─────────────────────────────────────────────────
//  /stats
// ─────────────────────────────────────────────────
bot.command('stats', async (ctx) => {
  const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);

  const text =
    `🐜 *Your Colony Stats*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏰 Tier: *${getTierName(user.colonySize)}*\n` +
    `👷 Workers: *${fmtK(user.colonySize)}*\n` +
    `🔍 Scouts: *${user.workers.scout}*\n` +
    `⚔️ Soldiers: *${user.workers.soldier}*\n` +
    `📦 Carriers: *${user.workers.carrier}*\n` +
    `👑 Queen Guards: *${user.workers.queen}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 Balance: *${fmt(user.balance, 3)} $ANT*\n` +
    `⛏️ Total Mined: *${fmt(user.totalMined, 3)} $ANT*\n` +
    `👥 Recruits: *${user.referrals.length}*\n` +
    `🌍 Global Rank: *#${user.rank}*`;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Open Colony', `${MINI_APP_URL}?user=${ctx.from.id}`)],
    ])
  });
});

// ─────────────────────────────────────────────────
//  /invite
// ─────────────────────────────────────────────────
bot.command('invite', async (ctx) => {
  const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  const botUsername = ctx.botInfo?.username || 'AntColonyBot';
  const refLink = `https://t.me/${botUsername}?start=ref_${ctx.from.id}`;

  const text =
    `🐜 *Recruit Ants for Your Colony!*\n\n` +
    `Every player you invite joins as *5 Worker Ants* in your colony — growing your empire and mining power!\n\n` +
    `🎁 *Rewards per invite:*\n` +
    `• +5 Worker Ants added instantly\n` +
    `• +0.1 $ANT bonus\n` +
    `• Recruits mine $ANT for you forever!\n\n` +
    `👥 *Your recruits so far:* ${user.referrals.length}\n` +
    `🐜 *Workers from recruits:* ${user.referrals.length * 5}\n\n` +
    `🔗 *Your invite link:*\n\`${refLink}\``;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.url('📤 Share on Telegram', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('🐜 Join my Ant Colony! Build your empire & mine $ANT tokens!')}`)],
      [Markup.button.webApp('🐜 Open Colony', `${MINI_APP_URL}?user=${ctx.from.id}`)],
    ])
  });
});

// ─────────────────────────────────────────────────
//  /leaderboard
// ─────────────────────────────────────────────────
bot.command('leaderboard', async (ctx) => {
  const allUsers = Array.from(users.values())
    .sort((a, b) => b.colonySize - a.colonySize)
    .slice(0, 10);

  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

  let text = `🏆 *Global Leaderboard — Top Colonies*\n━━━━━━━━━━━━━━━━━━━━\n`;

  if (allUsers.length === 0) {
    text += '_No players yet — be the first!_\n';
  } else {
    allUsers.forEach((u, i) => {
      const isYou = u.id === ctx.from.id ? ' ⭐ *You*' : '';
      text += `${medals[i]} @${u.username} — *${fmtK(u.colonySize)}* workers${isYou}\n`;
    });
  }

  const userRank = Array.from(users.values())
    .sort((a, b) => b.colonySize - a.colonySize)
    .findIndex(u => u.id === ctx.from.id) + 1;

  const me = users.get(ctx.from.id);
  if (me) {
    text += `━━━━━━━━━━━━━━━━━━━━\n🐜 *Your rank:* #${userRank} | *${fmtK(me.colonySize)}* workers`;
  }

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🐜 Build My Colony', `${MINI_APP_URL}?user=${ctx.from.id}`)],
    ])
  });
});

// ─────────────────────────────────────────────────
//  /wallet
// ─────────────────────────────────────────────────
bot.command('wallet', async (ctx) => {
  const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  const usdValue = (user.balance * 0.012).toFixed(4);

  const text =
    `💰 *Your $ANT Wallet*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💎 Balance: *${fmt(user.balance, 3)} $ANT*\n` +
    `💵 Est. Value: *~$${usdValue} USD*\n` +
    `⛏️ Total Mined: *${fmt(user.totalMined, 3)} $ANT*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 Token: *$ANT*\n` +
    `🌐 Network: *TON / BSC*\n` +
    `📦 Min Withdraw: *100 $ANT*\n\n` +
    `_Keep mining to reach the withdrawal threshold!_`;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('⛏️ Mine More $ANT', `${MINI_APP_URL}?user=${ctx.from.id}`)],
      [Markup.button.callback('🔄 Refresh Balance', 'wallet')],
    ])
  });
});

// ─────────────────────────────────────────────────
//  /claim — Daily reward
// ─────────────────────────────────────────────────
bot.command('claim', async (ctx) => {
  const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000; // 24 hours
  const elapsed = now - user.lastClaim;

  if (elapsed < cooldown) {
    const remaining = cooldown - elapsed;
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return ctx.reply(
      `⏳ *Daily Claim Not Ready*\n\nCome back in *${h}h ${m}m* for your next daily reward!`,
      { parse_mode: 'Markdown' }
    );
  }

  const baseReward = 0.5;
  const bonusReward = user.referrals.length * 0.05;
  const total = baseReward + bonusReward;

  user.balance += total;
  user.totalMined += total;
  user.lastClaim = now;

  await ctx.reply(
    `🎉 *Daily Reward Claimed!*\n\n` +
    `💰 Base reward: *+${fmt(baseReward, 1)} $ANT*\n` +
    `👥 Recruit bonus: *+${fmt(bonusReward, 2)} $ANT* (${user.referrals.length} recruits)\n` +
    `━━━━━━━━━━━━━━━\n` +
    `✅ Total: *+${fmt(total, 2)} $ANT*\n` +
    `💎 New balance: *${fmt(user.balance, 3)} $ANT*\n\n` +
    `_Come back tomorrow for your next claim!_`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🐜 Open Colony', `${MINI_APP_URL}?user=${ctx.from.id}`)],
      ])
    }
  );
});

// ─────────────────────────────────────────────────
//  /help
// ─────────────────────────────────────────────────
bot.command('help', async (ctx) => {
  await ctx.reply(
    `🐜 *Ant Colony — Command List*\n\n` +
    `🏠 /start — Open the game\n` +
    `📊 /stats — Your colony stats\n` +
    `💰 /wallet — Check your $ANT balance\n` +
    `🎁 /claim — Claim daily reward\n` +
    `👥 /invite — Get your recruit link\n` +
    `🏆 /leaderboard — Top colonies\n` +
    `❓ /help — Show this menu\n\n` +
    `*How to earn $ANT:*\n` +
    `• Mine passively inside the app\n` +
    `• Invite friends (+5 workers each)\n` +
    `• Complete daily missions\n` +
    `• Participate in colony events`,
    { parse_mode: 'Markdown' }
  );
});

// ─────────────────────────────────────────────────
//  Callback queries (inline button handlers)
// ─────────────────────────────────────────────────
bot.action('stats', async (ctx) => {
  await ctx.answerCbQuery();
  const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  await ctx.reply(
    `📊 *Quick Stats*\n\n` +
    `🏰 ${getTierName(user.colonySize)}\n` +
    `🐜 *${fmtK(user.colonySize)}* workers\n` +
    `💰 *${fmt(user.balance, 3)} $ANT*\n` +
    `👥 *${user.referrals.length}* recruits`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 Open Colony', `${MINI_APP_URL}?user=${ctx.from.id}`)],
      ])
    }
  );
});

bot.action('invite', async (ctx) => {
  await ctx.answerCbQuery();
  ctx.command = { text: '/invite' };
  const botUsername = ctx.botInfo?.username || 'AntColonyBot';
  const refLink = `https://t.me/${botUsername}?start=ref_${ctx.from.id}`;
  await ctx.reply(`🔗 Your invite link:\n\`${refLink}\``, { parse_mode: 'Markdown' });
});

bot.action('leaderboard', async (ctx) => {
  await ctx.answerCbQuery();
  // Re-use leaderboard logic
  const allUsers = Array.from(users.values()).sort((a, b) => b.colonySize - a.colonySize).slice(0, 5);
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
  let text = `🏆 *Top 5 Colonies*\n\n`;
  if (allUsers.length === 0) {
    text += '_Be the first to join!_';
  } else {
    allUsers.forEach((u, i) => {
      text += `${medals[i]} @${u.username} — ${fmtK(u.colonySize)} workers\n`;
    });
  }
  await ctx.reply(text, { parse_mode: 'Markdown' });
});

bot.action('wallet', async (ctx) => {
  await ctx.answerCbQuery('Balance refreshed ✅');
  const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);
  await ctx.reply(`💰 Balance: *${fmt(user.balance, 3)} $ANT*`, { parse_mode: 'Markdown' });
});

// ─────────────────────────────────────────────────
//  Handle Mini App data sent back from the web app
//  (use sendData() from Telegram.WebApp in the frontend)
// ─────────────────────────────────────────────────
bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);
    const user = getUser(ctx.from.id, ctx.from.username, ctx.from.first_name);

    if (data.action === 'sync') {
      // Sync colony state from mini app
      user.balance    = Math.max(user.balance, data.balance || 0);
      user.totalMined = Math.max(user.totalMined, data.totalMined || 0);
      user.colonySize = Math.max(user.colonySize, data.colonySize || user.colonySize);

      await ctx.reply(
        `✅ *Colony Synced!*\n\n` +
        `🐜 Workers: *${fmtK(user.colonySize)}*\n` +
        `💰 Balance: *${fmt(user.balance, 3)} $ANT*`,
        { parse_mode: 'Markdown' }
      );
    }

    if (data.action === 'withdraw') {
      if (user.balance < 100) {
        await ctx.reply(`❌ Need 100 $ANT to withdraw. You have *${fmt(user.balance, 3)}*`, { parse_mode: 'Markdown' });
      } else {
        user.balance -= data.amount;
        await ctx.reply(`✅ Withdrawal of *${data.amount} $ANT* submitted!`, { parse_mode: 'Markdown' });
      }
    }
  } catch (e) {
    console.error('web_app_data parse error:', e);
  }
});

// ─────────────────────────────────────────────────
//  Catch-all for text messages
// ─────────────────────────────────────────────────
bot.on('message', async (ctx) => {
  await ctx.reply(
    `🐜 Tap /start to open Ant Colony, or use the menu below!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🐜 Open Game', `${MINI_APP_URL}?user=${ctx.from.id}`)],
    ])
  );
});

// ─────────────────────────────────────────────────
//  Launch
// ─────────────────────────────────────────────────
bot.launch()
  .then(() => {
    console.log('🐜 Ant Colony Bot is running!');
    console.log('📱 Mini App URL:', MINI_APP_URL);
  })
  .catch(err => {
    if (err.message.includes('YOUR_BOT_TOKEN_HERE')) {
      console.error('❌ Please set your BOT_TOKEN in bot.js or as env variable!');
      console.error('   Get a token from @BotFather on Telegram');
    } else {
      console.error('Bot launch error:', err.message);
    }
  });

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
