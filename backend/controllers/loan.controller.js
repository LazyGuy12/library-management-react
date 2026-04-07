// controllers/loan.controller.js
const Loan = require('../models/loan.model');
const Book = require('../models/book.model');
const { calculateFine } = require('../utils/helpers');

// NGHIỆP VỤ MƯỢN SÁCH
exports.createLoan = async (req, res) => {
  try {
    const { bookId, daysToBorrow } = req.body;
    const userId = req.userId; // Get from JWT token
    
    if (!bookId) {
      return res.status(400).json({ message: "bookId là bắt buộc!" });
    }

    // 1. Kiểm tra sách còn trong kho không
    const book = await Book.findById(bookId);
    if (!book || book.available <= 0) {
      return res.status(400).json({ message: "Sách hiện đã hết trên kệ!" });
    }

<<<<<<< Updated upstream
    // 2. Tạo phiếu mượn
=======
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
>>>>>>> Stashed changes
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (daysToBorrow || 14));

    const loan = new Loan({
      book: bookId,
      user: userId,
      dueDate: dueDate,
      status: 'pending'  // Chờ lấy sách
    });

    // 3. Cập nhật số lượng sách (Giảm available đi 1)
    book.available -= 1;
    
    await loan.save();
    await book.save();

    res.status(201).json({ message: "Mượn sách thành công!", loan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

<<<<<<< Updated upstream
// NGHIỆP VỤ TRẢ SÁCH
=======
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
>>>>>>> Stashed changes
exports.returnBook = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findById(loanId);

    if (!loan || loan.status === 'returned') {
      return res.status(400).json({ message: "Phiếu mượn không hợp lệ hoặc đã trả rồi." });
    }

    const returnDate = new Date();
    
    // Calculate fine if overdue
    const fine = loan.dueDate < returnDate ? calculateFine(loan.dueDate, returnDate) : 0;
    
    // 1. Cập nhật trạng thái phiếu mượn
    loan.status = 'returned';
    loan.returnDate = returnDate;
    loan.fine = fine;

    // 2. Tăng lại số lượng sách trong kho
    const book = await Book.findById(loan.book);
    book.available += 1;

    await loan.save();
    await book.save();

    res.status(200).json({ 
      message: "Trả sách thành công!",
      fine: fine,
      fineMessage: fine > 0 ? `Bạn phải trả phạt: ${fine.toLocaleString('vi-VN')}đ` : "Không có tiền phạt"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};