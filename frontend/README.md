# Library Management System - Frontend

> React application for Library Management System

## Cài Đặt & Chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development
npm start

# Build production
npm build
```

## Cấu Trúc Folder

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── services/
│   │   ├── axiosConfig.js
│   │   └── authService.js
│   ├── styles/
│   │   ├── auth.css
│   │   └── app.css
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## Tính Năng

### Giao Diện Đăng Nhập
- Đăng nhập với username & mật khẩu
- Hiển thị / ẩn mật khẩu
- Validation form
- Lưu token vào localStorage
- Redirect đến dashboard

### Giao Diện Đăng Ký
- Đăng ký với username, email, mật khẩu, họ tên
- Validation field (email, mật khẩu >= 6 ký tự)
- Xác nhận mật khẩu
- Tự động đăng nhập sau khi đăng ký thành công
- Redirect đến dashboard

### Bảo Mật
- JWT Token (lưu vào localStorage)
- Refresh Token khi hết hạn (auto)
- Kiểm tra token khi truy cập routes protected
- Xóa token khi logout / token invalid

## API Endpoints

### Auth
- `POST /api/auth/signup` - Đăng ký
- `POST /api/auth/signin` - Đăng nhập
- `POST /api/auth/refresh-token` - Làm mới token
- `GET /api/auth/verify` - Kiểm tra token

## Kiến Trúc

### Axios Interceptor

```javascript
// src/services/axiosConfig.js
- Gắn token vào header mỗi request
- Tự động refresh token khi 401
- Handle error response
```

### Auth Service

```javascript
// src/services/authService.js
- signup()
- signin()
- verifyToken()
- refreshToken()
```

### Protected Routes

```javascript
// ProtectedRoute Component
- Kiểm tra token
- Redirect đến /login nếu không có token
```

## Files Tạo

1. **package.json** - Dependencies & scripts
2. **src/index.js** - Entry point
3. **src/App.jsx** - Main App component
4. **src/App.css** - App styles
5. **src/pages/LoginPage.jsx** - Login form
6. **src/pages/RegisterPage.jsx** - Register form
7. **src/services/axiosConfig.js** - Axios config
8. **src/services/authService.js** - Auth API calls
9. **src/styles/auth.css** - Auth styles
10. **public/index.html** - HTML template
11. **.gitignore** - Git ignore file

## Hướng Tiếp Theo

### Cần Thêm:
- [ ] Pages: Books, Loans, Fines, Dashboard, Profile
- [ ] Components: Navigation, Card, Modal, etc.
- [ ] Services: bookService, loanService, fineService, etc.
- [ ] State Management: Context API hoặc Redux (nếu cần)
- [ ] Error Handling: Global error handler
- [ ] Loading States: Skeleton, Spinner
- [ ] Notifications: Toast messages

## Ghi Chú

- Backend API Base URL: `http://localhost:5000/api`
- Token được lưu vào localStorage với key `accessToken` & `refreshToken`
- User info được lưu với key `user` (JSON stringify)
- Gia hạn token tự động khi nhận 401 response

---

Tạo bởi: Your Name
Ngày: 2026-04-06
