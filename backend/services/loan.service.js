// services/loan.service.js
const Loan = require('../models/loan.model');
const Book = require('../models/book.model');

const createLoanRecord = async (bookId, userId, days) => {
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) throw new Error("Sách không khả dụng");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (days || 14));

    const loan = new Loan({
        book: bookId,
        user: userId,
        dueDate: dueDate
    });

    book.available -= 1;
    await book.save();
    return await loan.save();
};

module.exports = { createLoanRecord };