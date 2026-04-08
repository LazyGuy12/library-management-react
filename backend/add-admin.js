#!/usr/bin/env node

/**
 * Script thêm tài khoản Admin mới (không xóa admin cũ)
 * Usage: node add-admin.js 88888888 admin@123
 *        hoặc node add-admin.js (nhập thông tin tương tác)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Import models
const User = require('./models/user.model');
const LibraryCard = require('./models/libraryCard.model');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function addAdmin() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Kết nối MongoDB thành công\n');

    // Nhập thông tin admin
    let adminMSSV = process.argv[2];
    let adminPassword = process.argv[3];

    if (!adminMSSV) {
      adminMSSV = await question('Nhập MSSV/Mã admin: ');
    }
    if (!adminPassword) {
      adminPassword = await question('Nhập mật khẩu: ');
    }

    const adminEmail = `admin${adminMSSV}@library.com`;
    const adminName = `Administrator ${adminMSSV}`;

    // Kiểm tra admin đã tồn tại
    console.log(`\n🔍 Kiểm tra MSSV ${adminMSSV}...`);
    const existingAdmin = await User.findOne({
      $or: [
        { mssv: adminMSSV },
        { email: adminEmail }
      ]
    });

    if (existingAdmin) {
      console.log(`❌ Admin với MSSV ${adminMSSV} đã tồn tại!`);
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    // Tạo user admin mới
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

    // Tạo thẻ độc giả
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

    // Hiển thị thông tin đăng nhập
    console.log('═══════════════════════════════════════════');
    console.log('📋 THÔNG TIN ĐĂNG NHẬP ADMIN MỚI');
    console.log('═══════════════════════════════════════════');
    console.log(`MSSV:    ${adminMSSV}`);
    console.log(`Mật khẩu: ${adminPassword}`);
    console.log(`Email:   ${adminEmail}`);
    console.log('═══════════════════════════════════════════\n');

    console.log('✅ Hoàn tất! Admin mới có thể đăng nhập ngay bây giờ.');
    rl.close();
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('   → Không thể kết nối MongoDB. Vui lòng kiểm tra:');
      console.error('     - MongoDB có đang chạy không?');
      console.error('     - MONGODB_URI trong .env có đúng không?');
    }
    rl.close();
    process.exit(1);
  }
}

// Chạy script
addAdmin();
