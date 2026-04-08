# 📚 Backend API Documentation — Library Management System

> **Base URL:** `http://localhost:5000/api`
>
> **Stack:** Node.js + Express + MongoDB + JWT

---

## 📋 Mục Lục

1. [Cài Đặt & Chạy Server](#1-cài-đặt--chạy-server)
2. [Xác Thực (Authentication)](#2-xác-thực-authentication)
3. [API Endpoints](#3-api-endpoints)
   - [Auth](#31-auth---apiauth)
   - [Books](#32-books---apibooks)
   - [Loans](#33-loans---apiloans)
   - [Cards](#34-library-cards---apicards)
   - [Fines](#35-fines---apifines)
   - [Users](#36-users---apiusers)
   - [Dashboard](#37-dashboard---apidashboard)
4. [Data Models](#4-data-models)
5. [Business Rules](#5-business-rules)
6. [Error Handling](#6-error-handling)
7. [Ví Dụ Tích Hợp React](#7-ví-dụ-tích-hợp-react)

---

## 1. Cài Đặt & Chạy Server

```bash
# Cài đặt dependencies
cd backend
npm install

# Chạy development (auto-reload)
npm run dev

# Chạy production
npm start
```

**File `.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library_react_db
JWT_SECRET=<your-secret-key>
```

**Health Check:** `GET /api/health` → `{ success: true, message: "✅ Server is running" }`

---

## 2. Xác Thực (Authentication)

### Gửi Token

Mỗi request cần xác thực phải gửi JWT token qua **một trong hai** header:

```
x-access-token: <token>
```
hoặc
```
Authorization: Bearer <token>
```

### Token Info

| Loại | Thời hạn | Mục đích |
|------|---------|----------|
| **Access Token** | 24 giờ | Gửi kèm mỗi request |
| **Refresh Token** | 48 giờ | Dùng để lấy access token mới khi hết hạn |

### Luồng xác thực trong React

```
1. POST /api/auth/signin → nhận accessToken + refreshToken
2. Lưu token vào localStorage/state
3. Gửi accessToken trong header mỗi request
4. Khi nhận 401 (token hết hạn) → POST /api/auth/refresh-token
5. Nhận accessToken mới → retry request cũ
6. Nếu refresh cũng fail → redirect về /login
```

---

## 3. API Endpoints

### Ký hiệu

| Ký hiệu | Ý nghĩa |
|----------|---------|
| 🔓 | Public — không cần token |
| 🔑 | Cần đăng nhập (bất kỳ role) |
| 🛡️ | Chỉ ADMIN |

---

### 3.1 Auth — `/api/auth`

#### 🔓 POST `/api/auth/signup` — Đăng ký

**Request Body:**
```json
{
  "username": "nguyenvana",
  "email": "a@gmail.com",
  "password": "123456",
  "fullName": "Nguyễn Văn A"
}
```

**Response 201:**
```json
{
  "message": "✅ Đăng ký thành công! Thẻ độc giả đã được tạo.",
  "user": {
    "id": "664a...",
    "username": "nguyenvana",
    "email": "a@gmail.com",
    "fullName": "Nguyễn Văn A",
    "role": "USER"
  },
  "libraryCard": {
    "cardNumber": "LIB-2026-AB1C",
    "status": "ACTIVE",
    "expiryDate": "2027-04-06T..."
  }
}
```

**Lỗi có thể xảy ra:**
- `400` — Thiếu field / Username đã tồn tại / Email đã tồn tại

---

#### 🔓 POST `/api/auth/signin` — Đăng nhập

**Request Body:**
```json
{
  "username": "nguyenvana",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "message": "✅ Đăng nhập thành công!",
  "id": "664a...",
  "username": "nguyenvana",
  "email": "a@gmail.com",
  "fullName": "Nguyễn Văn A",
  "role": "USER",
  "libraryCard": {
    "cardNumber": "LIB-2026-AB1C",
    "status": "ACTIVE",
    "expiryDate": "2027-04-06T...",
    "renewalCount": 0
  },
  "cardNotification": {
    "type": "WARNING",
    "message": "📅 Thẻ độc giả sắp hết hạn trong 25 ngày. Hãy gia hạn trước!"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "a1b2c3d4e5..."
}
```

> **`cardNotification`** có thể là `null` (thẻ bình thường) hoặc chứa:
> - `type: "DANGER"` — Thẻ bị khóa hoặc hết hạn
> - `type: "WARNING"` — Thẻ sắp hết hạn (< 30 ngày)

---

#### 🔓 POST `/api/auth/refresh-token` — Làm mới token

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGci...(mới)",
  "refreshToken": "a1b2c3d4e5..."
}
```

---

#### 🔑 GET `/api/auth/verify` — Kiểm tra token

**Response 200:**
```json
{
  "success": true,
  "message": "Token hợp lệ!",
  "userId": "664a...",
  "role": "USER"
}
```

---

### 3.2 Books — `/api/books`

#### 🔓 GET `/api/books` — Danh sách sách (có pagination + search)

**Query Parameters:**

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 10 | Số sách/trang (max 50) |
| `search` | string | — | Tìm theo tên sách, tác giả, ISBN |
| `category` | string | — | Lọc theo thể loại |
| `status` | string | — | Lọc: `AVAILABLE`, `BORROWED`, `LOST`, `DAMAGED` |

**Ví dụ:** `GET /api/books?search=java&page=1&limit=12`

**Response 200:**
```json
{
  "success": true,
  "books": [
    {
      "_id": "664b...",
      "title": "Lập Trình Java",
      "author": "Nguyễn Văn B",
      "category": "CNTT",
      "isbn": "978-604-123",
      "description": "Sách lập trình Java cơ bản",
      "image": "https://...",
      "quantity": 5,
      "available": 3,
      "status": "AVAILABLE",
      "location": "Khu A - Kệ 1",
      "createdAt": "2026-01-15T...",
      "updatedAt": "2026-04-01T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "pages": 4
  }
}
```

---

#### 🔓 GET `/api/books/:id` — Chi tiết sách

**Response 200:**
```json
{
  "success": true,
  "book": { /* Book object */ }
}
```

---

#### 🛡️ POST `/api/books` — Thêm sách mới

**Request Body:**
```json
{
  "title": "Lập Trình Java",
  "author": "Nguyễn Văn B",
  "category": "CNTT",
  "isbn": "978-604-123",
  "quantity": 5,
  "description": "Sách lập trình Java cơ bản",
  "image": "https://example.com/java.jpg",
  "location": "Khu A - Kệ 1"
}
```

> `title`, `author`, `category`, `quantity` là **bắt buộc**. `quantity >= 1`.

**Response 201:**
```json
{
  "success": true,
  "message": "✅ Thêm sách thành công!",
  "book": { /* Book object */ }
}
```

---

#### 🛡️ PUT `/api/books/:id` — Cập nhật sách

**Request Body:** Chỉ gửi những field muốn thay đổi.

```json
{
  "quantity": 10,
  "description": "Mô tả mới"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "✅ Cập nhật sách thành công!",
  "book": { /* Updated book */ }
}
```

---

#### 🛡️ DELETE `/api/books/:id` — Xóa sách

> ⚠️ Không thể xóa nếu sách đang có phiếu mượn chưa trả.

**Response 200:**
```json
{
  "success": true,
  "message": "✅ Xóa sách thành công!",
  "book": { /* Deleted book */ }
}
```

---

### 3.3 Loans — `/api/loans`

#### 🔑 POST `/api/loans` — Mượn sách

**Request Body:**
```json
{
  "bookId": "664b...",
  "daysToBorrow": 30
}
```

> `daysToBorrow` mặc định **30 ngày** nếu không gửi.

**Response 201:**
```json
{
  "success": true,
  "message": "✅ Mượn sách thành công!",
  "loan": {
    "id": "664c...",
    "bookTitle": "Lập Trình Java",
    "borrowDate": "2026-04-06T...",
    "dueDate": "2026-05-06T...",
    "status": "borrowed",
    "fine": 0
  }
}
```

**Lỗi có thể xảy ra:**

| Code | Lý do |
|------|-------|
| `403` | Không có thẻ / Thẻ bị khóa / Thẻ hết hạn |
| `400` | Sách hết / Đã mượn tối đa 3 cuốn / Đã mượn cuốn này rồi |

---

#### 🛡️ POST `/api/loans/admin/borrow` — Admin mượn sách cho user

**Request Body:**
```json
{
  "bookId": "664b...",
  "userId": "664a...",
  "daysToBorrow": 30
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "✅ Mượn sách cho Nguyễn Văn A thành công!",
  "loan": {
    "id": "664c...",
    "bookTitle": "Lập Trình Java",
    "userName": "Nguyễn Văn A",
    "borrowDate": "2026-04-06T...",
    "dueDate": "2026-05-06T...",
    "status": "borrowed"
  }
}
```

---

#### 🔑 PUT `/api/loans/return/:id` — Trả sách

> Không cần body. User được trả sách ngay cả khi thẻ hết hạn/bị khóa.

**Response 200 (đúng hạn):**
```json
{
  "success": true,
  "message": "✅ Trả sách thành công!",
  "loan": {
    "id": "664c...",
    "status": "returned",
    "returnDate": "2026-04-20T...",
    "fine": 0,
    "daysOverdue": 0
  },
  "fineRecord": null
}
```

**Response 200 (quá hạn):**
```json
{
  "success": true,
  "message": "⚠️ Trả sách thành công nhưng quá hạn! Phạt: 25.000₫",
  "loan": {
    "id": "664c...",
    "status": "returned",
    "returnDate": "2026-05-11T...",
    "fine": 25000,
    "daysOverdue": 5
  },
  "fineRecord": {
    "id": "664d...",
    "amount": 25000,
    "reason": "Trả sách quá hạn 5 ngày (Lập Trình Java)"
  }
}
```

> Khi quá hạn: Tự động tạo phiếu phạt PENDING + khóa thẻ (SUSPENDED).

---

#### 🔑 GET `/api/loans/user/history` — Lịch sử mượn của tôi

**Query:** `?status=borrowed` hoặc `returned` hoặc `overdue`

**Response 200:**
```json
{
  "success": true,
  "count": 3,
  "loans": [
    {
      "_id": "664c...",
      "book": { "_id": "...", "title": "Lập Trình Java", "author": "...", "isbn": "..." },
      "borrowDate": "2026-04-06T...",
      "dueDate": "2026-05-06T...",
      "returnDate": null,
      "status": "borrowed",
      "fine": 0
    }
  ]
}
```

---

#### 🛡️ GET `/api/loans/all` — Tất cả phiếu mượn (Admin)

**Query:** `?page=1&limit=10&status=borrowed`

**Response 200:**
```json
{
  "success": true,
  "loans": [
    {
      "_id": "664c...",
      "book": { "title": "...", "author": "...", "isbn": "..." },
      "user": { "username": "...", "fullName": "...", "email": "..." },
      "borrowDate": "...",
      "dueDate": "...",
      "status": "borrowed",
      "fine": 0
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 50, "pages": 5 }
}
```

---

#### 🔑 GET `/api/loans/:id` — Chi tiết phiếu mượn

**Response 200:**
```json
{
  "success": true,
  "loan": {
    "_id": "664c...",
    "book": { /* Full book object */ },
    "user": { "username": "...", "fullName": "...", "email": "..." },
    "borrowDate": "...",
    "dueDate": "...",
    "returnDate": null,
    "status": "borrowed",
    "fine": 0,
    "note": null
  }
}
```

---

### 3.4 Library Cards — `/api/cards`

#### 🛡️ GET `/api/cards` — Danh sách thẻ độc giả

**Response 200:**
```json
{
  "success": true,
  "count": 25,
  "cards": [
    {
      "_id": "664e...",
      "user": { "username": "nguyenvana", "fullName": "Nguyễn Văn A", "email": "a@gmail.com" },
      "cardNumber": "LIB-2026-AB1C",
      "status": "ACTIVE",
      "issuedDate": "2026-04-06T...",
      "expiryDate": "2027-04-06T...",
      "renewalCount": 0
    }
  ]
}
```

---

#### 🔑 GET `/api/cards/:userId` — Chi tiết thẻ + phiếu phạt

**Response 200:**
```json
{
  "success": true,
  "card": {
    "user": { "username": "...", "fullName": "...", "email": "..." },
    "cardNumber": "LIB-2026-AB1C",
    "status": "SUSPENDED",
    "expiryDate": "2027-04-06T...",
    "renewalCount": 0
  },
  "fines": [
    {
      "_id": "664d...",
      "fineType": "LATE_FEE",
      "amount": 25000,
      "reason": "Trả sách quá hạn 5 ngày",
      "status": "PENDING",
      "createdDate": "2026-04-11T..."
    }
  ],
  "totalFine": 25000
}
```

---

#### 🛡️ PUT `/api/cards/:userId/renew` — Gia hạn thẻ +1 năm

**Response 200:**
```json
{
  "success": true,
  "message": "✅ Gia hạn thẻ thành công! Thẻ có hiệu lực đến: 06/04/2028",
  "card": { /* Updated card */ }
}
```

---

#### 🔑 GET `/api/cards/:userId/status` — Kiểm tra trạng thái thẻ

**Response 200:**
```json
{
  "success": true,
  "card": { /* Card object */ },
  "currentStatus": "ACTIVE",
  "hasPendingFines": false,
  "pendingFineCount": 0
}
```

---

### 3.5 Fines — `/api/fines`

#### 🛡️ GET `/api/fines/all` — Tất cả phiếu phạt

**Query:** `?status=PENDING` hoặc `PAID`

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "totalAmount": 150000,
  "fines": [
    {
      "_id": "664d...",
      "user": { "username": "...", "fullName": "...", "email": "..." },
      "loan": { /* Loan object */ },
      "fineType": "LATE_FEE",
      "amount": 25000,
      "reason": "Trả sách quá hạn 5 ngày",
      "status": "PENDING",
      "createdDate": "2026-04-11T..."
    }
  ]
}
```

---

#### 🔑 GET `/api/fines/user/:userId` — Phiếu phạt của user

**Query:** `?status=PENDING`

---

#### 🛡️ POST `/api/fines` — Tạo phiếu phạt (hỏng/mất sách)

**Request Body:**
```json
{
  "userId": "664a...",
  "fineType": "DAMAGE",
  "amount": 50000,
  "reason": "Sách bị rách bìa"
}
```

> `fineType`: `LATE_FEE` | `DAMAGE` | `LOST`

**Response 201:**
```json
{
  "success": true,
  "message": "✅ Thêm phiếu phạt thành công!",
  "fine": { /* Fine object */ }
}
```

> Tự động khóa thẻ (SUSPENDED) khi tạo phiếu phạt.

---

#### 🛡️ PUT `/api/fines/:fineId/confirm-payment` — Xác nhận thanh toán

> Không cần body. Admin info lấy tự động từ JWT.

**Response 200:**
```json
{
  "success": true,
  "message": "✅ Xác nhận thanh toán thành công!\n✅ Thẻ độc giả đã được mở khóa!",
  "fine": {
    "status": "PAID",
    "paidDate": "2026-04-12T...",
    "confirmedBy": "admin",
    "confirmedAt": "2026-04-12T..."
  }
}
```

> Nếu không còn phiếu phạt PENDING nào → tự động mở khóa thẻ (ACTIVE).

---

#### 🔑 GET `/api/fines/:fineId` — Chi tiết phiếu phạt

---

### 3.6 Users — `/api/users`

#### 🔑 GET `/api/users/profile/me` — Thông tin tôi

**Response 200:**
```json
{
  "success": true,
  "user": {
    "_id": "664a...",
    "username": "nguyenvana",
    "email": "a@gmail.com",
    "fullName": "Nguyễn Văn A",
    "role": "USER",
    "createdAt": "2026-04-06T..."
  },
  "card": {
    "cardNumber": "LIB-2026-AB1C",
    "status": "ACTIVE",
    "expiryDate": "2027-04-06T...",
    "renewalCount": 0
  },
  "stats": {
    "activeLoans": 2,
    "pendingFines": 0,
    "totalFineAmount": 0
  }
}
```

---

#### 🔑 PUT `/api/users/profile/update` — Cập nhật hồ sơ

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A (mới)",
  "email": "newemail@gmail.com"
}
```

> Không cho phép đổi `username` và `role`.

---

#### 🔑 GET `/api/users/borrow-history` — Lịch sử mượn của tôi

**Query:** `?status=borrowed|returned|overdue`

---

#### 🛡️ GET `/api/users/all` — Danh sách user

**Query:** `?page=1&limit=10`

---

#### 🛡️ GET `/api/users/:id` — Chi tiết user

---

#### 🛡️ GET `/api/users/:id/borrow-history` — Lịch sử mượn user (Admin xem)

---

### 3.7 Dashboard — `/api/dashboard`

#### 🛡️ GET `/api/dashboard/stats` — Thống kê tổng quan

**Response 200:**
```json
{
  "success": true,
  "stats": {
    "books": {
      "total": 120,
      "available": 85,
      "borrowed": 35
    },
    "users": {
      "total": 50,
      "activeCards": 42,
      "expiredCards": 5,
      "suspendedCards": 3
    },
    "loans": {
      "total": 200,
      "active": 35,
      "returned": 160,
      "overdue": 5
    },
    "fines": {
      "pendingCount": 3,
      "pendingAmount": 75000,
      "paidCount": 15,
      "paidAmount": 350000
    },
    "topBorrowedBooks": [
      { "title": "Lập Trình Java", "author": "...", "borrowCount": 25 }
    ],
    "recentLoans": [
      {
        "book": { "title": "...", "author": "..." },
        "user": { "username": "...", "fullName": "..." },
        "borrowDate": "...",
        "status": "borrowed"
      }
    ]
  }
}
```

---

## 4. Data Models

### User
| Field | Type | Mô tả |
|-------|------|--------|
| `_id` | ObjectId | ID tự động |
| `username` | String | Tên đăng nhập (unique, lowercase) |
| `password` | String | Mật khẩu (bcrypt hash, không trả về) |
| `fullName` | String | Họ tên |
| `email` | String | Email (unique) |
| `role` | String | `USER` hoặc `ADMIN` |
| `createdAt` | Date | Ngày tạo |

### Book
| Field | Type | Mô tả |
|-------|------|--------|
| `_id` | ObjectId | ID tự động |
| `title` | String | Tên sách |
| `author` | String | Tác giả |
| `category` | String | Thể loại (CNTT, Kinh tế, Văn học...) |
| `isbn` | String | Mã ISBN (unique) |
| `description` | String | Mô tả |
| `image` | String | URL ảnh bìa |
| `quantity` | Number | Tổng số lượng nhập |
| `available` | Number | Số lượng còn trên kệ |
| `status` | String | `AVAILABLE` / `BORROWED` / `LOST` / `DAMAGED` |
| `location` | String | Vị trí kệ |

### Loan
| Field | Type | Mô tả |
|-------|------|--------|
| `_id` | ObjectId | ID tự động |
| `book` | ObjectId → Book | Sách mượn |
| `user` | ObjectId → User | Người mượn |
| `borrowDate` | Date | Ngày mượn |
| `dueDate` | Date | Hạn trả (mặc định +30 ngày) |
| `returnDate` | Date | Ngày trả thực tế (`null` nếu chưa trả) |
| `status` | String | `borrowed` / `returned` / `overdue` |
| `fine` | Number | Tiền phạt (0 nếu đúng hạn) |
| `note` | String | Ghi chú |

### LibraryCard
| Field | Type | Mô tả |
|-------|------|--------|
| `_id` | ObjectId | ID tự động |
| `user` | ObjectId → User | Chủ thẻ (unique) |
| `cardNumber` | String | Mã thẻ `LIB-YYYY-XXXX` |
| `status` | String | `ACTIVE` / `EXPIRED` / `SUSPENDED` |
| `issuedDate` | Date | Ngày cấp |
| `expiryDate` | Date | Ngày hết hạn |
| `renewalCount` | Number | Số lần gia hạn |

### Fine
| Field | Type | Mô tả |
|-------|------|--------|
| `_id` | ObjectId | ID tự động |
| `user` | ObjectId → User | Người bị phạt |
| `loan` | ObjectId → Loan | Phiếu mượn liên quan |
| `fineType` | String | `LATE_FEE` / `DAMAGE` / `LOST` |
| `amount` | Number | Số tiền phạt (VNĐ) |
| `reason` | String | Lý do |
| `status` | String | `PENDING` / `PAID` |
| `createdDate` | Date | Ngày tạo |
| `paidDate` | Date | Ngày thanh toán |
| `confirmedBy` | String | Admin xác nhận |
| `confirmedAt` | Date | Thời gian xác nhận |

---

## 5. Business Rules

### Mượn sách
- Tối đa **3 cuốn** cùng lúc
- Không mượn trùng cuốn đã mượn
- Thời hạn mặc định: **30 ngày**
- Yêu cầu: Thẻ `ACTIVE` + chưa hết hạn

### Trả sách
- Được trả dù thẻ hết hạn hoặc bị khóa
- Quá hạn → phạt **5.000₫/ngày**
- Quá hạn → tự động tạo phiếu phạt `PENDING` + khóa thẻ `SUSPENDED`

### Thẻ độc giả
- Tự động tạo khi đăng ký (hạn 1 năm)
- `SUSPENDED` → không mượn được, nhưng vẫn trả được
- `EXPIRED` → không mượn được, nhưng vẫn trả được
- Thanh toán hết phạt → tự động mở khóa `ACTIVE`
- Gia hạn → +1 năm, status → `ACTIVE`

### Xóa sách
- Không xóa được nếu có phiếu mượn chưa trả

---

## 6. Error Handling

Tất cả lỗi trả về format thống nhất:

```json
{
  "success": false,
  "message": "Mô tả lỗi bằng tiếng Việt"
}
```

hoặc (cho auth routes):

```json
{
  "message": "Mô tả lỗi"
}
```

### HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `400` | Lỗi validation / Business logic |
| `401` | Token không hợp lệ / hết hạn |
| `403` | Không có quyền / Thẻ bị khóa |
| `404` | Không tìm thấy resource |
| `500` | Lỗi server |

---

## 7. Ví Dụ Tích Hợp React

### Cấu hình Axios

```javascript
// src/api/axiosConfig.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Tự động gắn token vào mỗi request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['x-access-token'] = token;
  }
  return config;
});

// Tự động refresh token khi hết hạn
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('http://localhost:5000/api/auth/refresh-token', {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers['x-access-token'] = data.accessToken;
        return API(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
```

### Service Calls

```javascript
// src/api/bookService.js
import API from './axiosConfig';

export const getBooks = (params) => API.get('/books', { params });
export const getBookById = (id) => API.get(`/books/${id}`);
export const createBook = (data) => API.post('/books', data);
export const updateBook = (id, data) => API.put(`/books/${id}`, data);
export const deleteBook = (id) => API.delete(`/books/${id}`);
```

```javascript
// src/api/authService.js
import API from './axiosConfig';

export const login = (credentials) => API.post('/auth/signin', credentials);
export const register = (userData) => API.post('/auth/signup', userData);
export const verifyToken = () => API.get('/auth/verify');
```

```javascript
// src/api/loanService.js
import API from './axiosConfig';

export const borrowBook = (bookId) => API.post('/loans', { bookId });
export const returnBook = (loanId) => API.put(`/loans/return/${loanId}`);
export const getMyLoans = (status) => API.get('/loans/user/history', { params: { status } });
export const getAllLoans = (params) => API.get('/loans/all', { params });
export const getLoanById = (id) => API.get(`/loans/${id}`);
export const adminBorrow = (data) => API.post('/loans/admin/borrow', data);
```

```javascript
// src/api/cardService.js
import API from './axiosConfig';

export const getAllCards = () => API.get('/cards');
export const getCardByUserId = (userId) => API.get(`/cards/${userId}`);
export const renewCard = (userId) => API.put(`/cards/${userId}/renew`);
export const checkCardStatus = (userId) => API.get(`/cards/${userId}/status`);
```

```javascript
// src/api/fineService.js
import API from './axiosConfig';

export const getAllFines = (status) => API.get('/fines/all', { params: { status } });
export const getUserFines = (userId, status) => API.get(`/fines/user/${userId}`, { params: { status } });
export const confirmPayment = (fineId) => API.put(`/fines/${fineId}/confirm-payment`);
export const createFine = (data) => API.post('/fines', data);
```

```javascript
// src/api/dashboardService.js
import API from './axiosConfig';

export const getStats = () => API.get('/dashboard/stats');
```

### Component Ví Dụ — Danh sách sách

```jsx
import { useState, useEffect } from 'react';
import { getBooks } from '../api/bookService';

function BookList() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const { data } = await getBooks({ search, page, limit: 12 });
        setBooks(data.books);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Lỗi tải sách:', err.response?.data?.message);
      }
    };
    fetchBooks();
  }, [search, page]);

  return (
    <div>
      <input
        type="text"
        placeholder="Tìm sách..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />
      <div className="book-grid">
        {books.map((book) => (
          <div key={book._id} className="book-card">
            <img src={book.image} alt={book.title} />
            <h3>{book.title}</h3>
            <p>{book.author}</p>
            <span>Còn: {book.available}/{book.quantity}</span>
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div>
        Trang {pagination.page} / {pagination.pages}
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</button>
        <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Sau</button>
      </div>
    </div>
  );
}
```

---

## Tóm Tắt Nhanh — Tất Cả Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/api/auth/signup` | 🔓 | Đăng ký |
| POST | `/api/auth/signin` | 🔓 | Đăng nhập |
| POST | `/api/auth/refresh-token` | 🔓 | Refresh token |
| GET | `/api/auth/verify` | 🔑 | Kiểm tra token |
| GET | `/api/books` | 🔓 | Danh sách sách |
| GET | `/api/books/:id` | 🔓 | Chi tiết sách |
| POST | `/api/books` | 🛡️ | Thêm sách |
| PUT | `/api/books/:id` | 🛡️ | Sửa sách |
| DELETE | `/api/books/:id` | 🛡️ | Xóa sách |
| POST | `/api/loans` | 🔑 | Mượn sách |
| POST | `/api/loans/admin/borrow` | 🛡️ | Admin mượn sách cho user |
| PUT | `/api/loans/return/:id` | 🔑 | Trả sách |
| GET | `/api/loans/user/history` | 🔑 | Lịch sử mượn của tôi |
| GET | `/api/loans/all` | 🛡️ | Tất cả phiếu mượn |
| GET | `/api/loans/:id` | 🔑 | Chi tiết phiếu mượn |
| GET | `/api/cards` | 🛡️ | Danh sách thẻ |
| GET | `/api/cards/:userId` | 🔑 | Chi tiết thẻ + phạt |
| PUT | `/api/cards/:userId/renew` | 🛡️ | Gia hạn thẻ |
| GET | `/api/cards/:userId/status` | 🔑 | Trạng thái thẻ |
| GET | `/api/fines/all` | 🛡️ | Tất cả phiếu phạt |
| GET | `/api/fines/user/:userId` | 🔑 | Phiếu phạt của user |
| POST | `/api/fines` | 🛡️ | Tạo phiếu phạt |
| PUT | `/api/fines/:fineId/confirm-payment` | 🛡️ | Xác nhận thanh toán |
| GET | `/api/fines/:fineId` | 🔑 | Chi tiết phiếu phạt |
| GET | `/api/users/profile/me` | 🔑 | Thông tin tôi |
| PUT | `/api/users/profile/update` | 🔑 | Cập nhật hồ sơ |
| GET | `/api/users/borrow-history` | 🔑 | Lịch sử mượn |
| GET | `/api/users/all` | 🛡️ | Danh sách user |
| GET | `/api/users/:id` | 🛡️ | Chi tiết user |
| GET | `/api/users/:id/borrow-history` | 🛡️ | Lịch sử mượn user |
| GET | `/api/dashboard/stats` | 🛡️ | Thống kê tổng quan |
| GET | `/api/health` | 🔓 | Health check |
