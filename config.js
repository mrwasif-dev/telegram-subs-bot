// Configuration file for the bot

module.exports = {
    // Bot configuration
    BOT_TOKEN: process.env.BOT_TOKEN || '8226474686:AAEmXiWRGoeaa5pZpF2MZlYViYmSkM70fbI',
    ADMIN_ID: parseInt(process.env.ADMIN_ID) || 6012422087,
    
    // Data file
    DATA_FILE: process.env.DATA_FILE || './users.json',
    
    // Default plans
    DEFAULT_PLANS: [
        { 
            id: 'plan_350', 
            name: 'Basic Plan', 
            price: 350, 
            duration: 15, 
            features: '1 WhatsApp link device', 
            devices: 1, 
            active: true 
        },
        { 
            id: 'plan_500', 
            name: 'Standard Plan', 
            price: 500, 
            duration: 30, 
            features: '1 WhatsApp link device', 
            devices: 1, 
            active: true 
        },
        { 
            id: 'plan_1000', 
            name: 'Premium Plan', 
            price: 1000, 
            duration: 90, 
            features: '2 WhatsApp link devices', 
            devices: 2, 
            active: true 
        }
    ],
    
    // Password regex
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
    
    // Timezone (Pakistan)
    TIMEZONE_OFFSET: 5 * 60 * 60 * 1000 // UTC+5 for Pakistan
};
