const { Markup } = require('telegraf');
const db = require('../database');
const helpers = require('../utils/helpers');

const paymentHandlers = {
    // Show payment instructions
    showPaymentInstructions(ctx, planId) {
        const plan = db.getPlan(planId);
        const user = db.getUser(ctx.from.id);
        
        if (!plan) {
            return ctx.reply('Plan not found.');
        }
        
        if (!user) {
            return ctx.reply('Please register first.');
        }
        
        const { date, time } = helpers.getCurrentDateTime();
        const transactionId = `TXN-${Date.now()}-${ctx.from.id}`;
        
        // Save transaction to user session
        ctx.session = {
            ...ctx.session,
            pendingPayment: {
                planId,
                transactionId,
                amount: plan.price,
                timestamp: `${date} ${time}`
            }
        };
        
        const message = `*💰 Payment Instructions for ${plan.name}*\n\n` +
                       `Amount: *${plan.price} PKR*\n` +
                       `Duration: ${plan.duration} days\n` +
                       `Devices: ${plan.devices}\n\n` +
                       `*Payment Method:*\n` +
                       `1. Send ${plan.price} PKR to:\n` +
                       `   💳 EasyPaisa: 0300-1234567\n` +
                       `   📱 JazzCash: 0300-7654321\n` +
                       `   🏦 Bank: MCB Account # 123456789\n\n` +
                       `2. After payment, send screenshot to:\n` +
                       `   📞 WhatsApp: +92-300-1234567\n\n` +
                       `*Important:*\n` +
                       `• Include this Transaction ID: \`${transactionId}\`\n` +
                       `• Payment verification takes 1-24 hours\n` +
                       `• Your subscription starts after verification\n\n` +
                       `*Your Details:*\n` +
                       `👤 Name: ${user.name}\n` +
                       `📞 WhatsApp: ${user.whatsappNumber || 'To be updated'}\n\n` +
                       `Do you want to proceed with this plan?`;
        
        return ctx.reply(
            message,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Confirm Payment', `confirm_payment_${planId}`),
                        Markup.button.callback('❌ Cancel', 'user_plans')
                    ]
                ])
            }
        );
    },

    // Confirm payment
    confirmPayment(ctx, planId) {
        const plan = db.getPlan(planId);
        const userId = ctx.from.id;
        const user = db.getUser(userId);
        
        if (!plan || !user) {
            return ctx.reply('Error: Plan or user not found.');
        }
        
        // Update user with selected plan (payment not verified yet)
        const updatedUser = {
            ...user,
            plan: plan.name,
            devices: plan.devices,
            paymentVerified: false,
            paymentDate: helpers.getCurrentDateTime().date,
            expiryDate: null // Will be set after verification
        };
        
        db.setUser(userId, updatedUser);
        
        // Notify admin
        const adminMessage = `*💰 New Payment Request*\n\n` +
                            `👤 User: ${user.name} (${userId})\n` +
                            `📋 Plan: ${plan.name}\n` +
                            `💰 Amount: ${plan.price} PKR\n` +
                            `📞 WhatsApp: ${user.whatsappNumber || 'Not provided'}\n` +
                            `⏰ Time: ${helpers.getCurrentDateTime().time}\n\n` +
                            `Transaction ID: ${ctx.session?.pendingPayment?.transactionId || 'N/A'}`;
        
        ctx.telegram.sendMessage(
            process.env.ADMIN_ID,
            adminMessage,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Verify Payment', `admin_verify_${userId}`),
                        Markup.button.callback('❌ Reject Payment', `admin_reject_${userId}`)
                    ]
                ])
            }
        ).catch(console.error);
        
        return ctx.reply(
            `✅ *Payment request submitted!*\n\n` +
            `Your payment for *${plan.name}* has been recorded.\n` +
            `Our admin will verify your payment within 24 hours.\n\n` +
            `*Transaction ID:* \`${ctx.session?.pendingPayment?.transactionId || 'N/A'}\`\n\n` +
            `Please send payment screenshot to our WhatsApp number.\n\n` +
            `You will be notified once your payment is verified.`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📊 Check Dashboard', 'user_dashboard')],
                    [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
                ])
            }
        );
    },

    // Verify payment (admin)
    verifyPayment(ctx, userId) {
        const user = db.getUser(userId);
        
        if (!user) {
            return ctx.reply('User not found.');
        }
        
        // Calculate expiry date
        const plan = db.getPlan(user.plan);
        const expiryDate = helpers.calculateExpiryDate(plan.duration);
        
        // Update user
        const updatedUser = {
            ...user,
            paymentVerified: true,
            expiryDate,
            verifiedDate: helpers.getCurrentDateTime().date
        };
        
        db.setUser(userId, updatedUser);
        
        // Notify user
        const userMessage = `🎉 *Payment Verified!*\n\n` +
                           `Your payment for *${user.plan}* has been verified.\n` +
                           `✅ Subscription: ACTIVE\n` +
                           `📅 Expiry Date: ${helpers.formatDate(expiryDate)}\n` +
                           `📱 Devices: ${user.devices}\n\n` +
                           `You can now use our services.\n\n` +
                           `Thank you for your purchase!`;
        
        ctx.telegram.sendMessage(userId, userMessage, { parse_mode: 'Markdown' })
            .catch(err => console.log('Failed to notify user:', err));
        
        return ctx.reply(
            `✅ Payment verified for user ${user.name} (${userId})\n` +
            `Subscription active until: ${helpers.formatDate(expiryDate)}`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back to Admin Panel', 'admin_panel')]
            ])
        );
    },

    // Reject payment (admin)
    rejectPayment(ctx, userId) {
        db.setPendingRejection(userId, 'pending');
        
        return ctx.reply(
            'Please enter reason for rejection:',
            Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', `admin_view_user_${userId}`)]
            ])
        );
    },

    // Submit rejection reason
    submitRejection(ctx, userId, reason) {
        const user = db.getUser(userId);
        
        if (!user) {
            return ctx.reply('User not found.');
        }
        
        // Clear payment details
        const updatedUser = {
            ...user,
            plan: null,
            paymentVerified: false,
            expiryDate: null,
            devices: 0
        };
        
        db.setUser(userId, updatedUser);
        
        // Notify user
        const userMessage = `❌ *Payment Rejected*\n\n` +
                           `Your payment for *${user.plan}* has been rejected.\n\n` +
                           `*Reason:* ${reason}\n\n` +
                           `If you believe this is a mistake, please contact support.\n` +
                           `You can try making payment again.`;
        
        ctx.telegram.sendMessage(userId, userMessage, { parse_mode: 'Markdown' })
            .catch(err => console.log('Failed to notify user:', err));
        
        db.deletePendingRejection(userId);
        
        return ctx.reply(
            `❌ Payment rejected for user ${user.name}\n` +
            `Reason sent to user.`,
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back to Admin Panel', 'admin_panel')]
            ])
        );
    }
};

module.exports = paymentHandlers;
