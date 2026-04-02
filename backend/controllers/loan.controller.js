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

    // 2. Tạo phiếu mượn
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (daysToBorrow || 14));

    const loan = new Loan({
      book: bookId,
      user: userId,
      dueDate: dueDate,
      status: 'borrowed'
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

// NGHIỆP VỤ TRẢ SÁCH
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