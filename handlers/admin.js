const { Markup } = require('telegraf');
const db = require('../database');
const helpers = require('../utils/helpers');
const validators = require('../utils/validators');

const adminHandlers = {
    // Show admin panel
    showAdminPanel(ctx) {
        return ctx.reply(
            '👨‍💼 *Admin Panel*',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('👥 View All Users', 'admin_view_users')],
                    [Markup.button.callback('📋 Manage Plans', 'admin_manage_plans')],
                    [Markup.button.callback('💰 Verify Payments', 'admin_verify_payments')],
                    [Markup.button.callback('📢 Send Announcement', 'admin_send_announcement')],
                    [Markup.button.callback('📊 Statistics', 'admin_stats')],
                    [Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]
                ])
            }
        );
    },

    // View all users
    async viewAllUsers(ctx) {
        const users = db.getAllUsers();
        const userCount = Object.keys(users).length;
        
        if (userCount === 0) {
            return ctx.reply('No users found.');
        }

        let message = `*Total Users: ${userCount}*\n\n`;
        let userList = [];
        
        for (const [userId, userData] of Object.entries(users)) {
            userList.push({
                text: `${userData.name || 'Unknown'} (${userId}) - ${userData.plan || 'No plan'}`,
                callback_data: `admin_view_user_${userId}`
            });
        }

        // Split into chunks of 3 buttons each
        const chunks = [];
        for (let i = 0; i < userList.length; i += 3) {
            chunks.push(userList.slice(i, i + 3));
        }

        const buttons = chunks.map(chunk => 
            chunk.map(btn => Markup.button.callback(btn.text, btn.callback_data))
        );

        buttons.push([Markup.button.callback('🔙 Back to Admin Panel', 'admin_panel')]);

        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            }
        );
    },

    // View specific user
    viewUser(ctx, userId) {
        const user = db.getUser(userId);
        if (!user) {
            return ctx.reply('User not found.');
        }

        const userInfo = helpers.formatUserInfo(userId, user);
        
        return ctx.reply(
            `*User Details*\n\n${userInfo}`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Verify Payment', `admin_verify_${userId}`),
                        Markup.button.callback('❌ Reject Payment', `admin_reject_${userId}`)
                    ],
                    [
                        Markup.button.callback('🗑️ Delete User', `admin_delete_${userId}`),
                        Markup.button.callback('📝 Edit Plan', `admin_edit_plan_${userId}`)
                    ],
                    [Markup.button.callback('🔙 Back to Users List', 'admin_view_users')]
                ])
            }
        );
    },

    // Manage plans
    async managePlans(ctx) {
        const plans = db.getAllPlans();
        
        if (plans.length === 0) {
            return ctx.reply('No plans available.');
        }

        let message = '*Available Plans*\n\n';
        const buttons = [];
        
        plans.forEach(plan => {
            message += `${helpers.formatPlanInfo(plan)}\n\n`;
            buttons.push([
                Markup.button.callback(`✏️ Edit ${plan.name}`, `admin_edit_plan_${plan.id}`),
                Markup.button.callback(`🗑️ Delete ${plan.name}`, `admin_delete_plan_${plan.id}`)
            ]);
        });

        buttons.push([
            Markup.button.callback('➕ Add New Plan', 'admin_add_plan'),
            Markup.button.callback('🔙 Back to Admin Panel', 'admin_panel')
        ]);

        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            }
        );
    },

    // Start adding new plan
    startAddPlan(ctx) {
        ctx.session = { addingPlan: true, planStep: 'name' };
        return ctx.reply('Enter plan name:');
    },

    // Verify payments
    async verifyPayments(ctx) {
        const users = db.getAllUsers();
        const pendingUsers = [];
        
        for (const [userId, userData] of Object.entries(users)) {
            if (!userData.paymentVerified && userData.plan) {
                pendingUsers.push({
                    userId,
                    name: userData.name || 'Unknown',
                    plan: userData.plan,
                    whatsapp: userData.whatsappNumber || 'Not provided'
                });
            }
        }

        if (pendingUsers.length === 0) {
            return ctx.reply('No pending payments to verify.');
        }

        let message = `*Pending Payments (${pendingUsers.length})*\n\n`;
        const buttons = [];
        
        pendingUsers.forEach(user => {
            message += `👤 ${user.name}\n📋 ${user.plan}\n📞 ${user.whatsapp}\n\n`;
            buttons.push([
                Markup.button.callback(`✅ Verify ${user.name}`, `admin_verify_${user.userId}`),
                Markup.button.callback(`❌ Reject ${user.name}`, `admin_reject_${user.userId}`)
            ]);
        });

        buttons.push([Markup.button.callback('🔙 Back to Admin Panel', 'admin_panel')]);

        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            }
        );
    },

    // Send announcement
    sendAnnouncement(ctx) {
        ctx.session = { sendingAnnouncement: true };
        return ctx.reply('Please enter your announcement message:');
    },

    // Show statistics
    async showStats(ctx) {
        const users = db.getAllUsers();
        const userCount = Object.keys(users).length;
        
        let activeSubs = 0;
        let pendingPayments = 0;
        let totalRevenue = 0;
        
        for (const userData of Object.values(users)) {
            if (userData.paymentVerified) {
                activeSubs++;
                // Calculate revenue based on plan price
                const plan = db.getPlan(userData.plan);
                if (plan) {
                    totalRevenue += plan.price;
                }
            } else if (userData.plan) {
                pendingPayments++;
            }
        }

        const plans = db.getAllPlans();
        
        return ctx.reply(
            `*📊 Statistics*\n\n` +
            `👥 Total Users: ${userCount}\n` +
            `✅ Active Subscriptions: ${activeSubs}\n` +
            `⏳ Pending Payments: ${pendingPayments}\n` +
            `💰 Estimated Revenue: ${totalRevenue} PKR\n` +
            `📋 Available Plans: ${plans.length}\n\n` +
            `*Last Updated:* ${helpers.getCurrentDateTime().time}`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Refresh', 'admin_stats')],
                    [Markup.button.callback('🔙 Back to Admin Panel', 'admin_panel')]
                ])
            }
        );
    }
};

module.exports = adminHandlers;
