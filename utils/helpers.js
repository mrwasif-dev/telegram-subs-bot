const config = require('../config');

// Get current date and time in Pakistan timezone
function getCurrentDateTime() {
    const d = new Date();
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const pakistanTime = new Date(utc + config.TIMEZONE_OFFSET);

    const date = `${String(pakistanTime.getDate()).padStart(2, '0')}-${String(pakistanTime.getMonth() + 1).padStart(2, '0')}-${pakistanTime.getFullYear()}`;
    const time = `${String(pakistanTime.getHours()).padStart(2, '0')}:${String(pakistanTime.getMinutes()).padStart(2, '0')}:${String(pakistanTime.getSeconds()).padStart(2, '0')}`;

    return { date, time };
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr || dateStr === 'Not subscribed') return dateStr;
    const [day, month, year] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Check if subscription is expired
function isSubscriptionExpired(expiryDate) {
    if (!expiryDate || expiryDate === 'Not subscribed') return true;
    
    const { date: currentDate } = getCurrentDateTime();
    const [currentDay, currentMonth, currentYear] = currentDate.split('-').map(Number);
    const [expDay, expMonth, expYear] = expiryDate.split('-').map(Number);
    
    const current = new Date(currentYear, currentMonth - 1, currentDay);
    const expiry = new Date(expYear, expMonth - 1, expDay);
    
    return current > expiry;
}

// Calculate expiry date
function calculateExpiryDate(durationDays) {
    const { date: currentDate } = getCurrentDateTime();
    const [day, month, year] = currentDate.split('-').map(Number);
    
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + durationDays);
    
    return `${String(current.getDate()).padStart(2, '0')}-${String(current.getMonth() + 1).padStart(2, '0')}-${current.getFullYear()}`;
}

// Format user info for admin
function formatUserInfo(userId, userData) {
    const planName = userData.plan ? userData.plan : 'No plan';
    const expiry = userData.expiryDate ? formatDate(userData.expiryDate) : 'Not subscribed';
    const paymentStatus = userData.paymentVerified ? '✅ Verified' : '❌ Pending';
    const whatsapp = userData.whatsappNumber || 'Not provided';
    const registerDate = formatDate(userData.registerDate) || 'Unknown';
    
    return `👤 User ID: ${userId}
📞 WhatsApp: ${whatsapp}
📅 Registered: ${registerDate}
📋 Plan: ${planName}
💰 Payment: ${paymentStatus}
⏰ Expiry: ${expiry}
📱 Devices: ${userData.devices || 0}`;
}

// Format plan info
function formatPlanInfo(plan) {
    return `📋 ${plan.name}
💰 Price: ${plan.price} PKR
⏰ Duration: ${plan.duration} days
📱 Devices: ${plan.devices}
✨ Features: ${plan.features}
${plan.active ? '✅ Active' : '❌ Inactive'}`;
}

module.exports = {
    getCurrentDateTime,
    formatDate,
    isSubscriptionExpired,
    calculateExpiryDate,
    formatUserInfo,
    formatPlanInfo
};
