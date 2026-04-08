// controllers/borrowSlip.controller.js
const BorrowSlip = require('../models/borrowSlip.model');
const Book = require('../models/book.model');
const Fine = require('../models/fine.model');
const LibraryCard = require('../models/libraryCard.model');

// Generate unique slip code: PM-YYYYMMDD-XXXX
function generateSlipCode() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PM-${dateStr}-${rand}`;
}

// User tạo phiếu mượn sách từ giỏ sách
exports.createSlip = async (req, res) => {
  try {
    const { bookIds, daysToBorrow } = req.body;
    const userId = req.userId;
    const days = daysToBorrow || 30;

    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return res.status(400).json({ success: false, message: "Vui lòng chọn ít nhất 1 cuốn sách!" });
    }

    // 1. Kiểm tra thẻ độc giả
    const card = await LibraryCard.findOne({ user: userId });
    if (!card) {
      return res.status(403).json({ success: false, message: "❌ Không tìm thấy thẻ độc giả!" });
    }
    if (card.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: "🔒 Thẻ bị khóa! Vui lòng thanh toán phạt." });
    }
    if (card.status === 'EXPIRED' || card.expiryDate < new Date()) {
      return res.status(403).json({ success: false, message: "⚠️ Thẻ độc giả hết hạn!" });
    }

    // 2. Kiểm tra số sách đang mượn
    const activeSlips = await BorrowSlip.find({
      user: userId,
      status: { $in: ['pending', 'borrowed', 'overdue'] }
    });
    const activeBooksCount = activeSlips.reduce((sum, s) => sum + s.books.length, 0);
    if (activeBooksCount + bookIds.length > 3) {
      return res.status(400).json({
        success: false,
        message: `❌ Bạn đang mượn ${activeBooksCount} cuốn, chỉ có thể mượn thêm ${3 - activeBooksCount} cuốn!`
      });
    }

    // 3. Kiểm tra trùng sách đang mượn
    const activeBookIds = activeSlips.flatMap(s => s.books.map(b => b.toString()));
    for (const bookId of bookIds) {
      if (activeBookIds.includes(bookId)) {
        const book = await Book.findById(bookId);
        return res.status(400).json({
          success: false,
          message: `⚠️ Bạn đã mượn "${book?.title || bookId}" rồi!`
        });
      }
    }

    // 4. Kiểm tra sách còn
    for (const bookId of bookIds) {
      const book = await Book.findById(bookId);
      if (!book || book.available <= 0) {
        return res.status(400).json({
          success: false,
          message: `📚 Sách "${book?.title || bookId}" đã hết!`
        });
      }
    }

    // 5. Tạo phiếu mượn
    let slipCode = generateSlipCode();
    // Ensure unique
    while (await BorrowSlip.findOne({ slipCode })) {
      slipCode = generateSlipCode();
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const slip = new BorrowSlip({
      slipCode,
      user: userId,
      books: bookIds,
      dueDate,
      status: 'pending'
    });

    // Giảm số lượng sách
    for (const bookId of bookIds) {
      await Book.findByIdAndUpdate(bookId, { $inc: { available: -1 } });
    }

    const savedSlip = await slip.save();

    res.status(201).json({
      success: true,
      message: `✅ Tạo phiếu mượn ${slipCode} thành công!`,
      slip: {
        id: savedSlip._id,
        slipCode: savedSlip.slipCode,
        booksCount: bookIds.length,
        borrowDate: savedSlip.borrowDate,
        dueDate: savedSlip.dueDate,
        status: savedSlip.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi tạo phiếu mượn: " + err.message });
  }
};

// Lấy danh sách phiếu mượn của user
exports.getUserSlips = async (req, res) => {
  try {
    const userId = req.userId;
    const status = req.query.status;

    const filter = { user: userId };
    if (status) filter.status = status;

    const slips = await BorrowSlip.find(filter)
      .populate('books', 'title author isbn image')
      .sort({ borrowDate: -1 });

    res.status(200).json({ success: true, count: slips.length, slips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy tất cả phiếu mượn (Admin)
exports.getAllSlips = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 100));
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { status } : {};

    const slips = await BorrowSlip.find(filter)
      .populate('books', 'title author isbn image')
      .populate('user', 'username fullName email')
      .skip(skip)
      .limit(limit)
      .sort({ borrowDate: -1 });

    const total = await BorrowSlip.countDocuments(filter);

    res.status(200).json({
      success: true,
      slips,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy chi tiết phiếu mượn
exports.getSlipById = async (req, res) => {
  try {
    const slip = await BorrowSlip.findById(req.params.id)
      .populate('books', 'title author isbn image category')
      .populate('user', 'username fullName email');

    if (!slip) {
      return res.status(404).json({ success: false, message: "Phiếu mượn không tồn tại!" });
    }

    res.status(200).json({ success: true, slip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin xác nhận lấy sách (pending → borrowed)
exports.pickupSlip = async (req, res) => {
  try {
    const slip = await BorrowSlip.findById(req.params.id).populate('books user');
    if (!slip) {
      return res.status(404).json({ success: false, message: "❌ Không tìm thấy phiếu mượn!" });
    }
    if (slip.status !== 'pending') {
      return res.status(400).json({ success: false, message: `❌ Phiếu mượn đang ở trạng thái: ${slip.status}` });
    }

    slip.status = 'borrowed';
    await slip.save();

    res.status(200).json({
      success: true,
      message: `✅ Xác nhận lấy sách cho ${slip.user.fullName}!`,
      slip: { id: slip._id, slipCode: slip.slipCode, status: slip.status }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi: " + err.message });
  }
};

// Trả sách (borrowed/overdue → returned)
exports.returnSlip = async (req, res) => {
  try {
    const slip = await BorrowSlip.findById(req.params.id).populate('books');
    if (!slip) {
      return res.status(404).json({ success: false, message: "Phiếu mượn không tồn tại!" });
    }

    if (slip.status === 'returned') {
      return res.status(400).json({ success: false, message: "Phiếu mượn này đã trả rồi!" });
    }

    // Kiểm tra quyền
    if (slip.user.toString() !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Không có quyền trả phiếu mượn này!" });
    }

    // Tính phạt
    const returnDate = new Date();
    const daysOverdue = Math.max(0, Math.floor((returnDate - slip.dueDate) / (1000 * 60 * 60 * 24)));
    const FINE_PER_DAY = 5000;
    const fine = daysOverdue * FINE_PER_DAY * slip.books.length;

    slip.status = 'returned';
    slip.returnDate = returnDate;
    slip.fine = fine;
    await slip.save();

    // Tăng lại sách
    for (const book of slip.books) {
      await Book.findByIdAndUpdate(book._id, { $inc: { available: 1 } });
    }

    // Tạo phiếu phạt nếu quá hạn
    let fineRecord = null;
    if (daysOverdue > 0) {
      const bookTitles = slip.books.map(b => b.title).join(', ');
      fineRecord = new Fine({
        user: slip.user,
        loan: slip._id,
        fineType: 'LATE_FEE',
        amount: fine,
        reason: `Trả sách quá hạn ${daysOverdue} ngày (${bookTitles})`,
        status: 'PENDING'
      });
      await fineRecord.save();

      const card = await LibraryCard.findOne({ user: slip.user });
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
      slip: { id: slip._id, slipCode: slip.slipCode, status: slip.status, returnDate, fine, daysOverdue },
      fineRecord: fineRecord ? { id: fineRecord._id, amount: fineRecord.amount, reason: fineRecord.reason } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi trả sách: " + err.message });
  }
};
