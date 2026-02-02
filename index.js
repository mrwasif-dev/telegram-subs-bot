require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const db = require('./database');
const adminHandlers = require('./handlers/admin');
const userHandlers = require('./handlers/user');
const paymentHandlers = require('./handlers/payment');
const helpers = require('./utils/helpers');
const validators = require('./utils/validators');

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// ===== MIDDLEWARE =====
bot.use((ctx, next) => {
    // Initialize session if not exists
    if (!ctx.session) {
        ctx.session = {};
    }
    next();
});

// ===== COMMAND HANDLERS =====

// Start command
bot.start(async (ctx) => {
    await ctx.reply(
        '👋 *Welcome to WhatsApp Subscription Bot!*\n\n' +
        'Manage your WhatsApp subscription plans easily.\n\n' +
        'Use /help to see available commands.',
        { parse_mode: 'Markdown' }
    );
    
    // Show main menu after a short delay
    setTimeout(() => userHandlers.showMainMenu(ctx), 500);
});

// Help command
bot.help((ctx) => {
    const isAdmin = ctx.from.id.toString() === config.ADMIN_ID.toString();
    
    let message = '*📋 Available Commands*\n\n' +
                 '👤 *User Commands:*\n' +
                 '/start - Start the bot\n' +
                 '/dashboard - View your dashboard\n' +
                 '/plans - View available plans\n' +
                 '/register - Register new account\n' +
                 '/login - Login to account\n' +
                 '/settings - Account settings\n\n';
    
    if (isAdmin) {
        message += '👨‍💼 *Admin Commands:*\n' +
                  '/admin - Open admin panel\n' +
                  '/users - View all users\n' +
                  '/stats - View statistics\n' +
                  '/announce - Send announcement\n\n';
    }
    
    message += '*How to use:*\n' +
              '1. Register with /register\n' +
              '2. Choose a plan from /plans\n' +
              '3. Make payment\n' +
              '4. Send screenshot to admin\n' +
              '5. Wait for verification\n' +
              '6. Start using service!\n\n' +
              '*Support:* Contact admin for help.';
    
    ctx.reply(message, { parse_mode: 'Markdown' });
});

// Admin command
bot.command('admin', (ctx) => {
    if (ctx.from.id.toString() !== config.ADMIN_ID.toString()) {
        return ctx.reply('❌ Unauthorized access.');
    }
    return adminHandlers.showAdminPanel(ctx);
});

// Dashboard command
bot.command('dashboard', (ctx) => {
    return userHandlers.showDashboard(ctx);
});

// Plans command
bot.command('plans', (ctx) => {
    return userHandlers.showPlans(ctx);
});

// Register command
bot.command('register', (ctx) => {
    return userHandlers.startRegistration(ctx);
});

// Login command
bot.command('login', (ctx) => {
    return userHandlers.startLogin(ctx);
});

// Settings command
bot.command('settings', (ctx) => {
    return userHandlers.showSettings(ctx);
});

// ===== ACTION HANDLERS =====

// Back to main menu
bot.action('back_to_main', (ctx) => {
    ctx.deleteMessage().catch(() => {});
    return userHandlers.showMainMenu(ctx);
});

// User actions
bot.action('user_dashboard', (ctx) => {
    ctx.deleteMessage().catch(() => {});
    return userHandlers.showDashboard(ctx);
});

bot.action('user_plans', (ctx) => {
    ctx.deleteMessage().catch(() => {});
    return userHandlers.showPlans(ctx);
});

bot.action('user_register', (ctx) => {
    ctx.deleteMessage().catch(() => {});
    return userHandlers.startRegistration(ctx);
});

bot.action('user_login', (ctx) => {
    ctx.deleteMessage().catch(() => {});
    return userHandlers.startLogin(ctx);
});

bot.action('user_settings', (ctx) => {
    ctx.deleteMessage().catch(() => {});
