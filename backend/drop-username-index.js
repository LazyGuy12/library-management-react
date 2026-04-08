// Script to drop old username index from MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

const db = process.env.MONGODB_URI || 'mongodb://localhost:27017/library_react_db';

mongoose.connect(db, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Kết nối MongoDB thành công');
  
  try {
    // Lấy collection users
    const usersCollection = mongoose.connection.collection('users');
    
    // Liệt kê tất cả các index
    const indexes = await usersCollection.getIndexes();
    console.log('\n📋 Các index hiện tại:', Object.keys(indexes));
    
    // Xóa index username nếu tồn tại
    if (indexes.username_1) {
      await usersCollection.dropIndex('username_1');
      console.log('✅ Đã xóa index username_1');
    } else {
      console.log('ℹ️ Index username_1 không tồn tại');
    }
    
    // Kiểm tra các index sau khi xóa
    const newIndexes = await usersCollection.getIndexes();
    console.log('\n📋 Các index sau khi xóa:', Object.keys(newIndexes));
    
    console.log('\n✅ Hoàn tất! Bây giờ có thể đăng ký bình thường.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
})
.catch(err => {
  console.error('❌ Lỗi kết nối MongoDB:', err.message);
  process.exit(1);
});
