// services/loan.service.js
const Loan = require('../models/loan.model');
const Book = require('../models/book.model');
const Fine = require('../models/fine.model');
const LibraryCard = require('../models/libraryCard.model');

const FINE_PER_DAY = 5000; // 5.000₫/cuốn/ngày
const DEFAULT_BORROW_DAYS = 30; // 30 ngày theo nghiệp vụ
const MAX_BORROW_LIMIT = 3; // Tối đa 3 cuốn

const createLoanRecord = async (bookId, userId, days) => {
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) throw new Error("Sách không khả dụng");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (days || DEFAULT_BORROW_DAYS));

    const loan = new Loan({
        book: bookId,
        user: userId,
        dueDate: dueDate
    });

    book.available -= 1;
    await book.save();
    return await loan.save();
};

// Tính tiền phạt quá hạn
const calculateOverdueFine = (dueDate, returnDate) => {
    const diffTime = (returnDate || new Date()) - dueDate;
    const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return {
        daysOverdue: diffDays,
        fineAmount: diffDays * FINE_PER_DAY
    };
};

// Kiểm tra điều kiện mượn sách
const validateBorrowConditions = async (userId, bookId) => {
    // Kiểm tra thẻ
    const card = await LibraryCard.findOne({ user: userId });
    if (!card) throw new Error("Không tìm thấy thẻ độc giả!");
    if (card.status === 'SUSPENDED') throw new Error("Thẻ bị khóa do có phiếu phạt chưa thanh toán!");
    if (card.status === 'EXPIRED' || card.expiryDate < new Date()) throw new Error("Thẻ độc giả hết hạn!");

    // Kiểm tra sách
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) throw new Error("Sách hiện đã hết!");

    // Kiểm tra giới hạn
    const activeLoans = await Loan.countDocuments({ user: userId, status: { $in: ['borrowed', 'overdue'] } });
    if (activeLoans >= MAX_BORROW_LIMIT) throw new Error("Đã mượn tối đa 3 cuốn!");

    // Kiểm tra trùng
    const existingLoan = await Loan.findOne({ user: userId, book: bookId, status: { $in: ['borrowed', 'overdue'] } });
    if (existingLoan) throw new Error("Đã mượn cuốn sách này rồi!");

    return { card, book };
};

module.exports = { 
    createLoanRecord, 
    calculateOverdueFine, 
    validateBorrowConditions,
    FINE_PER_DAY, 
    DEFAULT_BORROW_DAYS, 
    MAX_BORROW_LIMIT 
};