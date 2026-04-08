// controllers/loan.controller.js
const Loan = require('../models/loan.model');
const Book = require('../models/book.model');
const Fine = require('../models/fine.model');
const LibraryCard = require('../models/libraryCard.model');
const { calculateFine, checkCardStatus } = require('../utils/helpers');

// NGHIỆP VỤ MƯỢN SÁCH - với đầy đủ điều kiện kiểm tra
exports.createLoan = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.userId;
    const daysToBorrow = req.body.daysToBorrow || 30; // Mặc định 30 ngày
    
    if (!bookId) {
      return res.status(400).json({ success: false, message: "bookId là bắt buộc!" });
    }

    // 1. Kiểm tra User có thẻ độc giả không
    const card = await LibraryCard.findOne({ user: userId });
    if (!card) {
      return res.status(403).json({ 
        success: false, 
        message: "❌ Không tìm thấy thẻ độc giả! Vui lòng liên hệ admin." 
      });
    }

    // 2. Kiểm tra thẻ ACTIVE
    if (card.status === 'SUSPENDED') {
      const pendingFines = await Fine.countDocuments({ 
        user: userId, 
        status: 'PENDING' 
      });
      return res.status(403).json({ 
        success: false, 
        message: `🔒 Thẻ bị khóa do có ${pendingFines} phiếu phạt chưa thanh toán!` 
      });
    }

    // 3. Kiểm tra thẻ hết hạn
    if (card.status === 'EXPIRED' || card.expiryDate < new Date()) {
      return res.status(403).json({ 
        success: false, 
        message: "⚠️ Thẻ độc giả hết hạn! Vui lòng liên hệ admin gia hạn." 
      });
    }

    // 4. Kiểm tra sách còn trong kho không
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "📚 Sách hiện đã hết trên kệ!" 
      });
    }

    // 5. Kiểm tra không vượt quá 3 cuốn
    const activeLoans = await Loan.countDocuments({ 
      user: userId, 
      status: { $in: ['borrowed', 'overdue'] }
    });
    if (activeLoans >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ Bạn đã mượn tối đa 3 cuốn! Vui lòng trả sách cũ trước." 
      });
    }

    // 6. Kiểm tra không mượn/đặt cuốn này lần nữa
    const existingLoan = await Loan.findOne({
      user: userId,
      book: bookId,
      status: { $in: ['pending', 'borrowed', 'overdue'] }
    });
    if (existingLoan) {
      return res.status(400).json({ 
        success: false, 
        message: "⚠️ Bạn đã mượn hoặc đặt cuốn sách này rồi! Vui lòng trả hoặc hủy đơn cũ." 
      });
    }

    // 7. ✅ Tất cả điều kiện OK → Tạo phiếu mượn
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToBorrow);

    const loan = new Loan({
      book: bookId,
      user: userId,
      dueDate: dueDate,
      status: 'pending'  // Chờ lấy sách
    });

    // Giảm số lượng sách
    book.available -= 1;
    
    const savedLoan = await loan.save();
    await book.save();

    res.status(201).json({ 
      success: true,
      message: "✅ Mượn sách thành công!",
      loan: {
        id: savedLoan._id,
        bookTitle: book.title,
        borrowDate: savedLoan.borrowDate,
        dueDate: savedLoan.dueDate,
        status: savedLoan.status,
        fine: savedLoan.fine
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi mượn sách: " + err.message });
  }
};

// ADMIN MƯỢN SÁCH CHO USER KHÁC - với card number và ngày trả tùy chỉnh
exports.adminCreateLoan = async (req, res) => {
  try {
    const { bookId, cardNumber, returnDate } = req.body;

    if (!bookId || !cardNumber || !returnDate) {
      return res.status(400).json({ 
        success: false, 
        message: "bookId, cardNumber và returnDate là bắt buộc!" 
      });
    }

    // Kiểm tra returnDate > hôm nay
    const selectedReturnDate = new Date(returnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedReturnDate <= today) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ Ngày trả sách phải sau hôm nay!" 
      });
    }

    // Tìm thẻ độc giả theo card number
    const libraryCard = await LibraryCard.findOne({ 
      cardNumber: cardNumber.toString().trim() 
    }).populate('user');
    
    if (!libraryCard) {
      return res.status(404).json({ 
        success: false, 
        message: `❌ Không tìm thấy thẻ độc giả với mã: ${cardNumber}!` 
      });
    }

    const targetUser = libraryCard.user;
    if (!targetUser || !targetUser._id) {
      return res.status(400).json({
        success: false,
        message: '❌ Thẻ độc giả không liên kết với user!'
      });
    }
    const userId = targetUser._id;

    // Kiểm tra trạng thái thẻ độc giả - phải ACTIVE mới được mượn
    if (libraryCard.status !== 'ACTIVE') {
      return res.status(403).json({ 
        success: false, 
        message: `❌ Thẻ độc giả không hoạt động! Trạng thái: ${libraryCard.status}` 
      });
    }
    
    // Kiểm tra thẻ hết hạn
    if (libraryCard.expiryDate && libraryCard.expiryDate < new Date()) {
      return res.status(403).json({ 
        success: false, 
        message: "⚠️ Thẻ độc giả đã hết hạn!" 
      });
    }

    // Kiểm tra sách
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "📚 Sách hiện đã hết!" 
      });
    }

    // Kiểm tra giới hạn 3 cuốn
    const activeLoans = await Loan.countDocuments({ 
      user: userId, 
      status: { $in: ['borrowed', 'overdue'] } 
    });
    if (activeLoans >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ Độc giả đã mượn tối đa 3 cuốn!" 
      });
    }

    // Kiểm tra không mượn trùng
    const existingLoan = await Loan.findOne({ 
      user: userId, 
      book: bookId, 
      status: { $in: ['borrowed', 'overdue'] } 
    });
    if (existingLoan) {
      return res.status(400).json({ 
        success: false, 
        message: "⚠️ Độc giả đã mượn cuốn sách này rồi!" 
      });
    }

    // ✅ Tất cả điều kiện OK → Tạo phiếu mượn (mượn trực tiếp nên status là borrowed)
    const loan = new Loan({ 
      book: bookId, 
      user: userId, 
      dueDate: selectedReturnDate,
      status: 'borrowed'  // Mượn trực tiếp nên sách đã được lấy
    });
    
    book.available -= 1;

    const savedLoan = await loan.save();
    await book.save();

    res.status(201).json({
      success: true,
      message: `✅ Tạo phiếu mượn cho ${targetUser.fullName} (${cardNumber}) thành công!`,
      loan: {
        id: savedLoan._id,
        bookTitle: book.title,
        userName: targetUser.fullName,
        cardNumber: cardNumber,
        borrowDate: savedLoan.borrowDate,
        dueDate: savedLoan.dueDate,
        status: savedLoan.status
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "❌ Lỗi tạo phiếu mượn: " + err.message 
    });
  }
};

// ADMIN ĐỀU XỨ LÝ PICKUP - chuyển trạng thái từ pending sang borrowed
exports.pickupLoan = async (req, res) => {
  try {
    const loanId = req.params.id;

    // Tìm phiếu mượn
    const loan = await Loan.findById(loanId).populate('book user');
    
    if (!loan) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ Không tìm thấy phiếu mượn!" 
      });
    }

    // Kiểm tra trạng thái là pending
    if (loan.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: `❌ Chỉ có thể lấy sách cho những phiếu đang chờ lấy! Trạng thái hiện tại: ${loan.status}` 
      });
    }

    // Cập nhật trạng thái sang borrowed
    loan.status = 'borrowed';
    await loan.save();

    res.status(200).json({
      success: true,
      message: `✅ Đã xác nhận lấy sách cho ${loan.user.fullName}!`,
      loan: {
        id: loan._id,
        bookTitle: loan.book.title,
        userName: loan.user.fullName,
        status: loan.status,
        dueDate: loan.dueDate
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "❌ Lỗi xác nhận lấy sách: " + err.message 
    });
  }
};

// NGHIỆP VỤ TRẢ SÁCH - với tính phí phạt
exports.returnBook = async (req, res) => {
  try {
    const loanId = req.params.id;
    const userId = req.userId;

    // 1. Lấy phiếu mượn
    const loan = await Loan.findById(loanId).populate('book');
    
    if (!loan) {
      return res.status(404).json({ 
        success: false,
        message: "Phiếu mượn không tồn tại!" 
      });
    }

    // 2. Kiểm tra quyền: User chỉ được trả sách của chính mình (hoặc là Admin)
    if (loan.user.toString() !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        message: "Bạn không có quyền trả phiếu mượn này!" 
      });
    }

    // 3. Kiểm tra trạng thái
    if (loan.status === 'returned') {
      return res.status(400).json({ 
        success: false,
        message: "Phiếu mượn này đã trả rồi!" 
      });
    }

    // 4. Tính phí phạt nếu quá hạn
    const returnDate = new Date();
    const daysOverdue = Math.max(0, Math.floor((returnDate - loan.dueDate) / (1000 * 60 * 60 * 24)));
    const FINE_AMOUNT_PER_DAY = 5000; // 5.000₫/cuốn/ngày
    let fine = daysOverdue * FINE_AMOUNT_PER_DAY;

    // 5. Cập nhật phiếu mượn
    loan.status = 'returned';
    loan.returnDate = returnDate;
    loan.fine = fine;
    await loan.save();

    // 6. Tăng lại số lượng sách
    const book = loan.book;
    book.available += 1;
    await book.save();

    // 7. Nếu quá hạn: Tạo phiếu phạt + khóa thẻ
    let fineRecord = null;
    if (daysOverdue > 0) {
      fineRecord = new Fine({
        user: loan.user,
        loan: loanId,
        fineType: 'LATE_FEE',
        amount: fine,
        reason: `Trả sách quá hạn ${daysOverdue} ngày (${book.title})`,
        status: 'PENDING'
      });
      await fineRecord.save();

      // Khóa thẻ độc giả
      const card = await LibraryCard.findOne({ user: loan.user });
      if (card && card.status === 'ACTIVE') {
        card.status = 'SUSPENDED';
        await card.save();
      }
    }

    res.status(200).json({ 
      success: true,
      message: daysOverdue > 0 
        ? `⚠️ Trả sách thành công nhưng quá hạn! Phạt: ${fine.toLocaleString('vi-VN')}₫`
        : "✅ Trả sách thành công!",
      loan: {
        id: loan._id,
        status: loan.status,
        returnDate: loan.returnDate,
        fine: loan.fine,
        daysOverdue
      },
      fineRecord: fineRecord ? {
        id: fineRecord._id,
        amount: fineRecord.amount,
        reason: fineRecord.reason
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi trả sách: " + err.message });
  }
};

// Lấy danh sách phiếu mượn của user
exports.getUserLoans = async (req, res) => {
  try {
    const userId = req.userId;
    const status = req.query.status;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .populate('book', 'title author isbn')
      .sort({ borrowDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: loans.length,
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách tất cả phiếu mượn (Admin)
exports.findAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { status } : {};

    const loans = await Loan.find(filter)
      .populate('book', 'title author isbn')
      .populate('user', 'username fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ borrowDate: -1 });

    const total = await Loan.countDocuments(filter);

    res.status(200).json({
      success: true,
      loans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy chi tiết một phiếu mượn
exports.findOne = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('book')
      .populate('user', 'username fullName email');

    if (!loan) {
      return res.status(404).json({ 
        success: false,
        message: "Phiếu mượn không tồn tại!" 
      });
    }

    res.status(200).json({ success: true, loan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};