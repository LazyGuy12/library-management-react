// controllers/dashboard.controller.js
const User = require('../models/user.model');
const Book = require('../models/book.model');
const Loan = require('../models/loan.model');
const Fine = require('../models/fine.model');
const LibraryCard = require('../models/libraryCard.model');

// Thống kê tổng quan cho Admin Dashboard
exports.getStats = async (req, res) => {
  try {
    // Thống kê sách
    const totalBooks = await Book.countDocuments();
    const totalAvailable = await Book.aggregate([{ $group: { _id: null, total: { $sum: '$available' } } }]);
    const totalBorrowed = await Loan.countDocuments({ status: { $in: ['borrowed', 'overdue'] } });

    // Thống kê người dùng
    const totalUsers = await User.countDocuments({ role: 'USER' });
    const activeCards = await LibraryCard.countDocuments({ status: 'ACTIVE' });
    const expiredCards = await LibraryCard.countDocuments({ status: 'EXPIRED' });
    const suspendedCards = await LibraryCard.countDocuments({ status: 'SUSPENDED' });

    // Thống kê mượn/trả
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'borrowed' });
    const returnedLoans = await Loan.countDocuments({ status: 'returned' });
    const overdueLoans = await Loan.countDocuments({ status: 'overdue' });

    // Thống kê phạt
    const pendingFines = await Fine.find({ status: 'PENDING' });
    const totalPendingAmount = pendingFines.reduce((sum, f) => sum + f.amount, 0);
    const paidFines = await Fine.find({ status: 'PAID' });
    const totalPaidAmount = paidFines.reduce((sum, f) => sum + f.amount, 0);

    // Sách mượn nhiều nhất (top 5)
    const topBorrowedBooks = await Loan.aggregate([
      { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookInfo' } },
      { $unwind: '$bookInfo' },
      { $project: { _id: 1, borrowCount: 1, title: '$bookInfo.title', author: '$bookInfo.author' } }
    ]);

    // Phiếu mượn gần đây (5 phiếu)
    const recentLoans = await Loan.find()
      .populate('book', 'title author')
      .populate('user', 'mssv fullName')
      .sort({ borrowDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        books: {
          total: totalBooks,
          available: totalAvailable[0]?.total || 0,
          borrowed: totalBorrowed
        },
        users: {
          total: totalUsers,
          activeCards,
          expiredCards,
          suspendedCards
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          returned: returnedLoans,
          overdue: overdueLoans
        },
        fines: {
          pendingCount: pendingFines.length,
          pendingAmount: totalPendingAmount,
          paidCount: paidFines.length,
          paidAmount: totalPaidAmount
        },
        topBorrowedBooks,
        recentLoans
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
