#!/usr/bin/env node

/**
 * Script tạo tài khoản Admin cho hệ thống quản lý thư viện
 * Usage: node setup-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const User = require('./models/user.model');
const LibraryCard = require('./models/libraryCard.model');

async function setupAdmin() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Kết nối MongoDB thành công\n');

    // Thông tin admin
    const adminMSSV = '99999999';
    const adminPassword = 'admin@123';
    const adminEmail = 'admin@library.com';
    const adminName = 'Administrator';

    // 1. Kiểm tra admin cũ và xóa
    console.log('🔍 Kiểm tra tài khoản admin cũ...');
    const existingAdmin = await User.findOne({
      $or: [
        { mssv: adminMSSV },
        { email: adminEmail },
        { username: 'admin' } // Từ hệ thống cũ
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Tìm thấy admin cũ, đang xóa...');
      await LibraryCard.deleteMany({ user: existingAdmin._id });
      await User.deleteOne({ _id: existingAdmin._id });
      console.log('✅ Đã xóa admin cũ\n');
    }

    // 2. Tạo user admin mới
    console.log('👤 Tạo tài khoản admin mới...');
    const newAdmin = new User({
      mssv: adminMSSV,
      email: adminEmail,
      password: adminPassword,
      fullName: adminName,
      role: 'ADMIN'
    });

    const savedAdmin = await newAdmin.save();
    console.log('✅ Tài khoản admin được tạo thành công!');
    console.log(`   MSSV: ${savedAdmin.mssv}`);
    console.log(`   Email: ${savedAdmin.email}`);
    console.log(`   Tên: ${savedAdmin.fullName}`);
    console.log(`   Vai trò: ${savedAdmin.role}\n`);

    // 3. Tạo thẻ độc giả
    console.log('🎫 Tạo thẻ độc giả...');
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const year = new Date().getFullYear();
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cardNumber = `LIB-${year}-${randomCode}`;

    const libraryCard = new LibraryCard({
      user: savedAdmin._id,
      cardNumber: cardNumber,
      status: 'ACTIVE',
      expiryDate: expiryDate
    });

    const savedCard = await libraryCard.save();
    console.log('✅ Thẻ độc giả được tạo thành công!');
    console.log(`   Số thẻ: ${savedCard.cardNumber}`);
    console.log(`   Trạng thái: ${savedCard.status}`);
    console.log(`   Hạn dùng: ${savedCard.expiryDate.toLocaleDateString('vi-VN')}\n`);

    // 4. Hiển thị thông tin đăng nhập
    console.log('═══════════════════════════════════════════');
    console.log('📋 THÔNG TIN ĐĂNG NHẬP ADMIN');
    console.log('═══════════════════════════════════════════');
    console.log(`MSSV:    ${adminMSSV}`);
    console.log(`Mật khẩu: ${adminPassword}`);
    console.log(`Email:   ${adminEmail}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('⚠️  LƯU Ý: Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu!\n');

    // 5. Đóng kết nối
    await mongoose.disconnect();
    console.log('✅ Hoàn tất! Bạn có thể đăng nhập admin ngay bây giờ.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   → Không thể kết nối MongoDB. Vui lòng kiểm tra:');
      console.error('     - MongoDB có đang chạy không?');
      console.error('     - MONGODB_URI trong .env có đúng không?');
    }
    process.exit(1);
  }
}

// Chạy script
setupAdmin();
