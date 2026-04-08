const Review = require('../models/review.model');
const Book = require('../models/book.model');
const Loan = require('../models/loan.model');
const BorrowSlip = require('../models/borrowSlip.model');

// Tạo hoặc cập nhật review
exports.createReview = async (req, res) => {
  try {
    const { bookId } = req.params;
    const { score, comment } = req.body;
    const userId = req.userId;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: "Điểm đánh giá phải từ 1 đến 5!" });
    }

    if (comment && comment.length > 1000) {
      return res.status(400).json({ success: false, message: "Bình luận tối đa 1000 ký tự!" });
    }

    // Kiểm tra user đã mượn và trả sách chưa
    const returnedLoan = await Loan.findOne({ book: bookId, user: userId, status: 'returned' });
    const returnedSlip = await BorrowSlip.findOne({ books: bookId, user: userId, status: 'returned' });

    if (!returnedLoan && !returnedSlip) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn phải mượn và trả sách này trước khi đánh giá!" 
      });
    }

    // Check if review already exists (to mark isEdited)
    const existingReview = await Review.findOne({ book: bookId, user: userId });

    // Upsert review
    const updateData = { score, comment };
    if (existingReview) {
      updateData.isEdited = true;
    }
    const review = await Review.findOneAndUpdate(
      { book: bookId, user: userId },
      updateData,
      { upsert: true, new: true, runValidators: true }
    );

    // Cập nhật avgRating trên Book model
    const stats = await Review.aggregate([
      { $match: { book: review.book } },
      { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        avgRating: Math.round(stats[0].avg * 10) / 10,
        totalRatings: stats[0].count
      });
    }

    res.status(200).json({
      success: true,
      message: "✅ Cảm ơn bạn đã đánh giá sách!",
      review,
      avgRating: stats[0]?.avg ? Math.round(stats[0].avg * 10) / 10 : score,
      totalRatings: stats[0]?.count || 1
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Bạn đã đánh giá sách này rồi!" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy danh sách reviews cho một sách
exports.getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const filterStar = parseInt(req.query.star) || 0; // 0 = tất cả
    const currentUserId = req.query.currentUserId; // To put own review first

    const filter = { book: bookId };
    if (filterStar >= 1 && filterStar <= 5) {
      filter.score = filterStar;
    }

    let myReview = null;
    if (currentUserId && page === 1) {
      const myFilter = { ...filter, user: currentUserId };
      myReview = await Review.findOne(myFilter)
        .populate('user', 'fullName email');
    }

    const excludeFilter = { ...filter };
    if (myReview) {
      excludeFilter._id = { $ne: myReview._id };
    }

    const [otherReviews, total] = await Promise.all([
      Review.find(myReview ? excludeFilter : filter)
        .populate('user', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(myReview && page === 1 ? Math.max(0, skip) : skip)
        .limit(myReview && page === 1 ? limit - 1 : limit),
      Review.countDocuments(filter)
    ]);

    const reviews = myReview && page === 1 ? [myReview, ...otherReviews] : otherReviews;

    res.status(200).json({
      success: true,
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy thống kê đánh giá cho một sách (avg, distribution)
exports.getBookReviewStats = async (req, res) => {
  try {
    const { bookId } = req.params;

    const [avgResult, distribution] = await Promise.all([
      Review.aggregate([
        { $match: { book: require('mongoose').Types.ObjectId.createFromHexString(bookId) } },
        { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $match: { book: require('mongoose').Types.ObjectId.createFromHexString(bookId) } },
        { $group: { _id: '$score', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ])
    ]);

    // Build distribution map { 5: X, 4: X, 3: X, 2: X, 1: X }
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(d => { dist[d._id] = d.count; });

    res.status(200).json({
      success: true,
      avgRating: avgResult[0] ? Math.round(avgResult[0].avg * 10) / 10 : 0,
      totalRatings: avgResult[0]?.count || 0,
      distribution: dist
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Kiểm tra user có được phép đánh giá sách không (đã từng mượn và trả)
exports.checkCanReview = async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.userId;

    const [returnedLoan, returnedSlip, existingReview] = await Promise.all([
      Loan.findOne({ book: bookId, user: userId, status: 'returned' }),
      BorrowSlip.findOne({ books: bookId, user: userId, status: 'returned' }),
      Review.findOne({ book: bookId, user: userId })
    ]);

    const canReview = !!(returnedLoan || returnedSlip);

    res.status(200).json({
      success: true,
      canReview,
      existingReview: existingReview || null
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
