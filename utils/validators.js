const config = require('../config');

// Validate password
function validatePassword(password) {
    return config.PASSWORD_REGEX.test(password);
}

// Validate WhatsApp number (basic validation)
function validateWhatsAppNumber(number) {
    // Basic validation for Pakistani numbers
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
}

// Validate price
function validatePrice(price) {
    const num = parseInt(price);
    return !isNaN(num) && num > 0;
}

// Validate duration
function validateDuration(duration) {
    const num = parseInt(duration);
    return !isNaN(num) && num > 0;
}

// Validate devices count
function validateDevices(devices) {
    const num = parseInt(devices);
    return !isNaN(num) && num > 0 && num <= 5;
}

module.exports = {
    validatePassword,
    validateWhatsAppNumber,
    validatePrice,
    validateDuration,
    validateDevices
};
