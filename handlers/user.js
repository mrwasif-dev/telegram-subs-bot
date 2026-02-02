const { Markup } = require('telegraf');
const db = require('../database');
const helpers = require('../utils/helpers');
const validators = require('../utils/validators');

const userHandlers = {
    // Show main menu
    showMainMenu(ctx) {
        const user = db.getUser(ctx.from.id);
        
        let message = '👋 *Welcome to WhatsApp Subscription Bot!*\n\n';
        
        if (user) {
            const isExpired = helpers.isSubscriptionExpired(user.expiryDate);
            const expiryStatus = isExpired ? '❌ EXPIRED' : '✅ Active';
            const expiryDate = user.expiryDate ? helpers.formatDate(user.expiryDate) : 'Not subscribed';
            
            message += `*Welcome back, ${user.name}!*\n\n` +
                      `📋 Plan: ${user.plan || 'No plan'}\n` +
                      `💰 Payment: ${user.paymentVerified ? '✅ Verified' : '❌ Pending'}\n` +
                      `⏰ Status: ${expiryStatus}\n` +
                      `📅 Expiry: ${expiryDate}\n\n` +
                      `Please choose an option:`;
        } else {
            message += 'You are not registered. Please register to use our services.';
        }
        
        const buttons = [];
        
        if (user) {
            buttons.push(
                [Markup.button.callback('📊 Dashboard', 'user_dashboard')],
                [Markup.button.callback('📋 View Plans', 'user_plans')],
                [Markup.button.callback('💰 Make Payment', 'user_payment')],
                [Markup.button.callback('⚙️ Settings', 'user_settings')]
            );
        } else {
            buttons.push(
                [Markup.button.callback('📝 Register', 'user_register')],
                [Markup.button.callback('🔐 Login', 'user_login')]
            );
        }
        
        if (ctx.from.id.toString() === process.env.ADMIN_ID) {
            buttons.push([Markup.button.callback('👨‍💼 Admin Panel', 'admin_panel')]);
        }
        
        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            }
        );
    },

    // Show dashboard
    showDashboard(ctx) {
        const userId = ctx.from.id;
        const user = db.getUser(userId);
        
        if (!user) {
            return ctx.reply('Please register first.', Markup.inlineKeyboard([
                [Markup.button.callback('📝 Register', 'user_register')]
            ]));
        }
        
        const isExpired = helpers.isSubscriptionExpired(user.expiryDate);
        const expiryStatus = isExpired ? '❌ EXPIRED' : '✅ Active';
        const expiryDate = user.expiryDate ? helpers.formatDate(user.expiryDate) : 'Not subscribed';
        const paymentStatus = user.paymentVerified ? '✅ Verified' : '❌ Pending';
        
        let message = `*📊 Your Dashboard*\n\n` +
                     `👤 Name: ${user.name}\n` +
                     `📞 WhatsApp: ${user.whatsappNumber || 'Not provided'}\n` +
                     `📋 Plan: ${user.plan || 'No plan'}\n` +
                     `💰 Payment: ${paymentStatus}\n` +
                     `⏰ Status: ${expiryStatus}\n` +
                     `📅 Expiry: ${expiryDate}\n` +
                     `📱 Devices: ${user.devices || 0}\n\n`;
        
        if (isExpired && user.plan) {
            message += '⚠️ *Your subscription has expired!*\nPlease renew to continue using our services.\n';
        } else if (!user.paymentVerified && user.plan) {
            message += '⏳ *Payment pending verification.*\nOur admin will verify your payment soon.\n';
        }
        
        const buttons = [
            [Markup.button.callback('🔄 Refresh', 'user_dashboard')],
            [Markup.button.callback('📋 View Plans', 'user_plans')]
        ];
        
        if (user.plan && (isExpired || !user.paymentVerified)) {
            buttons.push([Markup.button.callback('🔄 Renew/Update Plan', 'user_plans')]);
        }
        
        buttons.push([Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]);
        
        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            }
        );
    },

    // Show available plans
    showPlans(ctx) {
        const plans = db.getAllPlans();
        
        if (plans.length === 0) {
            return ctx.reply('No plans available at the moment.');
        }
        
        let message = '*📋 Available Plans*\n\n';
        
        plans.forEach((plan, index) => {
            message += `${index + 1}. *${plan.name}*\n` +
                      `   💰 Price: ${plan.price} PKR\n` +
                      `   ⏰ Duration: ${plan.duration} days\n` +
                      `   📱 Devices: ${plan.devices}\n` +
                      `   ✨ ${plan.features}\n\n`;
        });
        
        const buttons = plans.map(plan => 
            [Markup.button.callback(`📝 Subscribe to ${plan.name}`, `user_subscribe_${plan.id}`)]
        );
        
        buttons.push([Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]);
        
        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            }
        );
    },

    // Start registration
    startRegistration(ctx) {
        ctx.session = { registering: true, regStep: 'name' };
        return ctx.reply('Please enter your name:');
    },

    // Start login
    startLogin(ctx) {
        ctx.session = { loggingIn: true, loginStep: 'email' };
        return ctx.reply('Please enter your email:');
    },

    // Show settings
    showSettings(ctx) {
        const user = db.getUser(ctx.from.id);
        
        if (!user) {
            return ctx.reply('Please register first.');
        }
        
        return ctx.reply(
            '*⚙️ Settings*\n\nWhat would you like to update?',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✏️ Update Name', 'setting_update_name')],
                    [Markup.button.callback('📞 Update WhatsApp', 'setting_update_whatsapp')],
                    [Markup.button.callback('🔑 Change Password', 'setting_update_password')],
                    [Markup.button.callback('🗑️ Delete Account', 'setting_delete_account')],
                    [Markup.button.callback('🔙 Back to Dashboard', 'user_dashboard')]
                ])
            }
        );
    }
};

module.exports = userHandlers;
