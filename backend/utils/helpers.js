// utils/helpers.js

// Tính toán số ngày quá hạn và tiền phạt
exports.calculateFine = (dueDate, returnDate) => {
    const diffTime = returnDate - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    const finePerDay = 5000; // 5k mỗi ngày quá hạn
    return diffDays * finePerDay;
};

// Format ngày tháng hiển thị
exports.formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN');
};

// Kiểm tra trạng thái thẻ độc giả
exports.checkCardStatus = (card) => {
    if (!card) return { valid: false, status: 'NOTFOUND' };
    
    const now = new Date();
    
    if (card.status === 'SUSPENDED') return { valid: false, status: 'SUSPENDED' };
    if (card.status === 'EXPIRED' || card.expiryDate < now) return { valid: false, status: 'EXPIRED' };
    if (card.status === 'ACTIVE') return { valid: true, status: 'ACTIVE' };
    
    return { valid: false, status: card.status };
};

// Tính số ngày của một thẻ
exports.getDaysUntilExpiry = (expiryDate) => {
    const now = new Date();
    const diffTime = expiryDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Generate Mã thẻ độc giả
exports.generateCardNumber = () => {
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LIB-${year}-${randomStr}`;
};

// Validate email
exports.isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
