# Hướng Dẫn Giao Diện Đăng Nhập & Đăng Ký

## 📋 Nội Dung

1. [Tổng Quan](#tổng-quan)
2. [Cài Đặt & Chạy](#cài-đặt--chạy)
3. [Giao Diện Đăng Nhập](#giao-diện-đăng-nhập)
4. [Giao Diện Đăng Ký](#giao-diện-đăng-ký)
5. [Luồng Xác Thực](#luồng-xác-thực)
6. [Xử Lý Lỗi](#xử-lý-lỗi)
7. [Tính Năng](#tính-năng)

---

## Tổng Quan

Frontend được xây dựng với:
- **React 18** - UI framework
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling (responsive, gradient, animations)

---

## Cài Đặt & Chạy

### 1. Cài Đặt Dependencies

```bash
cd frontend
npm install
```

### 2. Tạo File `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Chạy Development Server

```bash
npm start
```

> Trình duyệt sẽ mở tự động: `http://localhost:3000`

### 4. Chạy Production

```bash
npm build
npm start  # hoặc serve -s build
```

---

## Giao Diện Đăng Nhập

### Địa chỉ: `/login`

**Tính Năng:**
- ✅ Input: Tên đăng nhập, Mật khẩu
- ✅ Nút "Hiển thị/Ẩn mật khẩu" (👁️)
- ✅ Validation form (không để trống)
- ✅ Xử lý lỗi đăng nhập
- ✅ Hiệu ứng loading (nút disabled)
- ✅ Link "Đăng ký ngay"
- ✅ Tự động lưu token & user info vào localStorage
- ✅ Redirect đến `/dashboard` nếu thành công

**Screenshot:**
```
┌────────────────────────────────┐
│       📚 Thư Viện              │
│  Hệ Thống Quản Lý Thư Viện     │
├────────────────────────────────┤
│                                │
│  Đăng Nhập                     │
│                                │
│  Tên đăng nhập: [_________] 🚫 │
│                                │
│  Mật khẩu:     [_________] 👁️ │
│                                │
│      [    Đăng Nhập    ]       │
│                                │
│  Chưa có tài khoản?            │
│  📎 Đăng ký ngay               │
└────────────────────────────────┘
```

**Flow:**
1. User nhập username & password
2. Click "Đăng Nhập"
3. API gửi request đến `POST /api/auth/signin`
4. Nếu thành công:
   - Lưu `accessToken` & `refreshToken` vào localStorage
   - Lưu user info vào localStorage
   - Redirect đến `/dashboard`
5. Nếu thất bại:
   - Hiển thị error message đó (ví dụ: "Tên đăng nhập hoặc mật khẩu không đúng")

---

## Giao Diện Đăng Ký

### Địa chỉ: `/register`

**Tính Năng:**
- ✅ Input: Họ tên, Tên đăng nhập, Email, Mật khẩu, Xác nhận mật khẩu
- ✅ Validation:
  - Tên đăng nhập >= 3 ký tự
  - Email hợp lệ
  - Mật khẩu >= 6 ký tự
  - Xác nhận mật khẩu phải khớp
- ✅ Hiển thị/ẩn mật khẩu
- ✅ Xử lý lỗi validation
- ✅ Hiệu ứng loading
- ✅ Link "Đã có tài khoản? Đăng nhập"
- ✅ Tính năng mở khóa mật khẩu riêng cho confirm

**Screenshot:**
```
┌────────────────────────────────┐
│       📚 Thư Viện              │
│  Hệ Thống Quản Lý Thư Viện     │
├────────────────────────────────┤
│                                │
│  Đăng Ký Tài Khoản             │
│                                │
│  Họ tên:        [__________] 🚫│
│  Tên đăng nhập: [__________] 🚫│
│  Email:         [__________] 🚫│
│  Mật khẩu:      [__________] 👁│
│  Xác nhận MK:   [__________] 👁│
│                                │
│      [       Đăng Ký       ]   │
│                                │
│  Đã có tài khoản?              │
│  📎 Đăng nhập                  │
└────────────────────────────────┘
```

**Flow:**
1. User điền tất cả thông tin
2. Click "Đăng Ký"
3. Frontend validate form
4. Nếu hợp lệ:
   - API gửi request đến `POST /api/auth/signup`
   - Backend tự động tạo thẻ độc giả (libraryCard)
5. Nếu thành công:
   - Tự động đăng nhập (nếu API trả về token)
   - Redirect đến `/dashboard`
6. Nếu thất bại:
   - Hiển thị error (ví dụ: "Username đã tồn tại")

---

## Luồng Xác Thực

### Authentication Flow

```
┌─────────────────────────────────────────────────────┐
│                    User Actions                      │
└────────────┬──────────────────────────┬──────────────┘
             │                          │
        Đăng Nhập                   Đăng Ký
             │                          │
             ▼                          ▼
    ┌──────────────────┐      ┌──────────────────┐
    │ POST /signin     │      │ POST /signup     │
    │ (username, pass) │      │ (user data)      │
    └────────┬─────────┘      └────────┬─────────┘
             │                         │
             │◄────────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Nhận Token:          │
    │ - accessToken (24h)  │
    │ - refreshToken (48h) │
    │ - User info          │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Lưu localStorage:    │
    │ - accessToken        │
    │ - refreshToken       │
    │ - user               │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Redirect:            │
    │ /dashboard           │
    └──────────────────────┘
```

### Token Refresh Flow

```
User Request
    │
    ▼
API Interceptor (giắm token vào header)
    │
    ▼
Response 401 (Token hết hạn)
    │
    ▼
Tự động gọi /refresh-token
    │
    ├─ Thành công ──▶ Lưu token mới ──▶ Retry request cũ ──▶ ✅ Thành công
    │
    └─ Thất bại ────▶ Xóa localStorage ──▶ Redirect /login ──▶ ❌ Đăng nhập lại
```

---

## Xử Lý Lỗi

### Login Errors

| Error | Nguyên Nhân | Thông Báo |
|-------|------------|-----------|
| 400 | Username/password trống | "Vui lòng nhập tên đăng nhập" |
| 401 | Username/password sai | "Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu." |
| 403 | Thẻ bị khóa / hết hạn | "Thẻ độc giả của bạn đã bị khóa hoặc hết hạn" (từ API) |
| 500 | Server error | "Lỗi server. Vui lòng thử lại sau." |

### Register Errors

| Lỗi | Thông Báo |
|-----|----------|
| Tên đăng nhập trống | "Vui lòng nhập tên đăng nhập" |
| Tên đăng nhập < 3 ký tự | "Tên đăng nhập phải có ít nhất 3 ký tự" |
| Email trống | "Vui lòng nhập email" |
| Email không hợp lệ | "Email không hợp lệ" |
| Mật khẩu trống | "Vui lòng nhập mật khẩu" |
| Mật khẩu < 6 ký tự | "Mật khẩu phải có ít nhất 6 ký tự" |
| Xác nhận MK không khớp | "Mật khẩu xác nhận không khớp" |
| Username đã tồn tại | "[Từ API] Username đã tồn tại" |
| Email đã tồn tại | "[Từ API] Email đã tồn tại" |

---

## Tính Năng

### ✅ Đã Implement

#### LoginPage Component
- [x] Form validation
- [x] Show/hide password
- [x] API call (signin)
- [x] Token storage
- [x] Error handling
- [x] Loading state
- [x] Link to register page
- [x] Redirect to dashboard
- [x] Responsive design
- [x] Animation & styling

#### RegisterPage Component
- [x] Form validation (client-side)
- [x] Show/hide password (2 fields)
- [x] API call (signup)
- [x] Token storage
- [x] Error handling
- [x] Loading state
- [x] Link to login page
- [x] Redirect to dashboard
- [x] Responsive design
- [x] Animation & styling

#### Auth Service
- [x] signup()
- [x] signin()
- [x] verifyToken()
- [x] refreshToken()

#### Axios Interceptor
- [x] Auto attach token to header
- [x] Auto refresh token on 401
- [x] Handle expired token
- [x] Redirect to login on auth fail

#### Protected Routes
- [x] Check token on mount
- [x] Redirect to login if no token
- [x] Dashboard page (placeholder)

#### Styling
- [x] Auth form styling
- [x] Gradient background
- [x] Input focus states
- [x] Button hover/active states
- [x] Error message animation
- [x] Responsive design (mobile)

### 🚀 Cần Implement Tiếp

- [ ] **Books Pages**: Danh sách sách, chi tiết sách, tìm kiếm
- [ ] **Loan Pages**: Mượn sách, lịch sử mượn, trả sách
- [ ] **Dashboard**: Thống kê, top books, recent loans
- [ ] **User Profile**: Xem/sửa thông tin, card status
- [ ] **Fine Pages**: Danh sách phạt, thanh toán
- [ ] **Admin Pages**: Quản lý sách, user, loans
- [ ] **Navigation**: Sidebar, breadcrumb, header menu
- [ ] **Components**:
  - [ ] Card/Book Item Component
  - [ ] Modal Dialog
  - [ ] Toast Notification
  - [ ] Loading Spinner
  - [ ] Pagination
  - [ ] Search Bar
  - [ ] Data Table
- [ ] **State Management**: Context API hoặc Redux
- [ ] **Error Handling**: Global error boundary & handler
- [ ] **Loading States**: Skeleton screens
- [ ] **Themes**: Dark mode support
- [ ] **Testing**: Unit tests, integration tests

---

## Hướng Dẫn Chi Tiết

### Cách Thêm Trang Mới

**Bước 1**: Tạo component
```jsx
// src/pages/BooksPage.jsx
import React from 'react';

function BooksPage() {
  return <div>Books Page</div>;
}

export default BooksPage;
```

**Bước 2**: Import vào App.jsx
```jsx
import BooksPage from './pages/BooksPage';
```

**Bước 3**: Thêm route
```jsx
<Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
```

**Bước 4**: Thêm link navigation
```jsx
<Link to="/books">Sách</Link>
```

### Cách Gọi API

**Ví dụ: Lấy danh sách sách**

```javascript
// src/services/bookService.js
import API from './axiosConfig';

export const bookService = {
  getBooks: (params) => API.get('/books', { params }),
  getBookById: (id) => API.get(`/books/${id}`),
  createBook: (data) => API.post('/books', data),
  updateBook: (id, data) => API.put(`/books/${id}`, data),
  deleteBook: (id) => API.delete(`/books/${id}`),
};
```

**Sử dụng trong component:**

```jsx
import { useEffect, useState } from 'react';
import { bookService } from '../services/bookService';

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await bookService.getBooks({ page: 1, limit: 10 });
        setBooks(response.data.books);
      } catch (err) {
        setError(err.response?.data?.message || 'Lỗi tải sách');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {books.map((book) => (
        <div key={book._id}>{book.title}</div>
      ))}
    </div>
  );
}

export default BooksPage;
```

---

## Ghi Chú Quan Trọng

⚠️ **Before Deploy:**
- [ ] Kiểm tra baseURL API (production)
- [ ] Tắt console.log debug
- [ ] Set NODE_ENV=production
- [ ] HTTPS cho production
- [ ] CORS configuration trên backend
- [ ] Security headers

✅ **Best Practices:**
- Sử dụng environment variables cho API URL
- Không commit `.env` file
- Validate data trước khi gửi API
- Show loading state cho user
- Handle all error cases
- Use proper HTTP status codes
- Logout khi token invalid

---

Tạo bởi: Your Name  
Ngày: 2026-04-06
