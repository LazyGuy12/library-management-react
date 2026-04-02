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