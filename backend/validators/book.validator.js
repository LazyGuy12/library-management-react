// validators/book.validator.js
exports.validateBook = (data) => {
    const errors = {};

    if (!data.title || data.title.trim() === "") {
        errors.title = "Tiêu đề sách không được để trống";
    }

    if (!data.quantity || data.quantity < 1) {
        errors.quantity = "Số lượng phải ít nhất là 1";
    }

    if (!data.isbn) {
        errors.isbn = "Mã ISBN là bắt buộc";
    }

    return {
        errors,
        isValid: Object.keys(errors).length === 0
    };
};