# Cloudinary Setup Guide

## 1. Tạo tài khoản Cloudinary

1. Truy cập: https://cloudinary.com
2. Nhấn **Sign Up** (Free)
3. Điền thông tin email, password, và tên miền của bạn
4. Xác nhận email

## 2. Lấy API Credentials

Sau khi đăng nhập:

1. Vào **Dashboard** hoặc **Settings**
2. Cuộn xuống tìm **API Keys**
3. Bạn sẽ thấy:
   - **Cloud Name** - Tên cloud của bạn
   - **API Key** - Khóa API công khai
   - **API Secret** - Khóa API bí mật (giữ kín!)

## 3. Cập nhật .env file

Mở file `backend/.env` và thay thế:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Ví dụ:
```env
CLOUDINARY_CLOUD_NAME=dnz1fqyw2
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

## 4. Cập nhật trên AWS Elastic Beanstalk

Bạn cần thêm các environment variables vào EB:

```bash
eb setenv CLOUDINARY_CLOUD_NAME=your_cloud_name
eb setenv CLOUDINARY_API_KEY=your_api_key
eb setenv CLOUDINARY_API_SECRET=your_api_secret
```

Hoặc qua AWS Console:
1. Vào AWS Elastic Beanstalk
2. Chọn environment **library-backend-env**
3. Vào **Configuration** → **Software**
4. Thêm các environment variables

## 5. Cách hoạt động

- Khi user upload hình ảnh sách → Lưu lên **Cloudinary**
- Cloudinary trả về **URL công khai**
- Backend lưu URL vào MongoDB
- Frontend hiển thị hình từ URL

## Free Tier Cloudinary

- **Up to 25 GB storage**
- **Up to 25 GB bandwidth/month**
- **Up to 300,000 transformations/month**
- Rất đủ cho ứng dụng nhỏ đến vừa

## Lợi ích

✅ Hình ảnh lưu trên cloud (không lấy space EB)
✅ CDN toàn cầu - Tải nhanh
✅ Tự động optimize theo device
✅ Xóa hình cũ khi cập nhật
✅ Quản lý lịch sử revision
