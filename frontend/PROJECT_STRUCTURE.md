# Project Structure

```
library-management-react/
│
├── backend/                          # Backend API (Node.js + Express)
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
│
├── frontend/                         # Frontend React App (NEW)
│   ├── public/
│   │   └── index.html               # HTML entry point
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── LibraryCard.jsx      # 📇 Library card component
│   │   │   └── Navigation.jsx       # 🧭 Navigation bar
│   │   │
│   │   ├── pages/
│   │   │   ├── AdminBooksPage.jsx   # 📚 Admin book management
│   │   │   ├── AdminCardsPage.jsx   # 💳 Admin card management
│   │   │   ├── AdminFinesPage.jsx   # 💰 Admin fine management
│   │   │   ├── AdminLoansPage.jsx   # 📋 Admin loan management
│   │   │   ├── BorrowHistoryPage.jsx # 📖 Borrow history
│   │   │   ├── BorrowSchedulePage.jsx # 📅 Borrow schedule
│   │   │   ├── FinesPage.jsx        # 💸 User fines page
│   │   │   ├── HomePage.jsx         # 🏠 Home page
│   │   │   ├── LoginPage.jsx        # 🔐 Login form
│   │   │   ├── ProfilePage.jsx      # 👤 User profile
│   │   │   └── RegisterPage.jsx     # 📝 Register form
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js       # Auth API calls
│   │   │   ├── axiosConfig.js       # Axios setup + interceptors
│   │   │   ├── bookService.js       # Book API calls
│   │   │   ├── fineService.js       # Fine API calls
│   │   │   ├── loanService.js       # Loan API calls
│   │   │   └── userService.js       # User API calls
│   │   │
│   │   ├── styles/
│   │   │   ├── admin.css            # Admin pages styling
│   │   │   ├── auth.css             # Auth form styling
│   │   │   ├── borrow-history.css   # Borrow history styling
│   │   │   ├── borrow-schedule.css  # Borrow schedule styling
│   │   │   ├── fines.css            # Fines page styling
│   │   │   ├── home.css             # Home page styling
│   │   │   ├── library-card.css     # Library card styling
│   │   │   ├── navigation.css       # Navigation styling
│   │   │   └── profile.css          # Profile page styling
│   │   │
│   │   ├── App.jsx                  # Main component + routing
│   │   ├── App.css
│   │   └── index.js                 # React entry point
│   │
│   ├── .env.example                 # Environment template
│   ├── .gitignore
│   ├── package.json                 # Dependencies
│   ├── README.md                    # Frontend docs
│   ├── AUTHENTICATION_GUIDE.md      # Detailed auth guide
│   └── PROJECT_STRUCTURE.md         # This file
│
└── README.md                         # Main project docs (API)
```

## Files Summary

### Backend (Existing)
- API server chạy trên port 5000
- MongoDB database
- JWT authentication
- Complete API endpoints

### Frontend (New)

#### Core Files
| File | Purpose |
|------|---------|
| `package.json` | Dependencies & npm scripts |
| `public/index.html` | HTML template |
| `src/index.js` | React entry point |
| `src/App.jsx` | Main component + routing |

#### Pages
| File | Purpose |
|------|---------|
| `pages/HomePage.jsx` | Home page |
| `pages/LoginPage.jsx` | Login form |
| `pages/RegisterPage.jsx` | Register form |
| `pages/ProfilePage.jsx` | User profile |
| `pages/BorrowSchedulePage.jsx` | Borrow schedule |
| `pages/BorrowHistoryPage.jsx` | Borrow history |
| `pages/FinesPage.jsx` | User fines management |
| `pages/AdminBooksPage.jsx` | Admin book management |
| `pages/AdminCardsPage.jsx` | Admin card management |
| `pages/AdminFinesPage.jsx` | Admin fine management |
| `pages/AdminLoansPage.jsx` | Admin loan management |

#### Components
| File | Purpose |
|------|---------|
| `components/Navigation.jsx` | Navigation bar |
| `components/LibraryCard.jsx` | Library card component |

#### Services
| File | Purpose |
|------|---------|
| `services/axiosConfig.js` | Axios config + interceptors |
| `services/authService.js` | Auth API methods |
| `services/bookService.js` | Book API methods |
| `services/fineService.js` | Fine API methods |
| `services/loanService.js` | Loan API methods |
| `services/userService.js` | User API methods |

#### Styling
| File | Purpose |
|------|---------|
| `styles/admin.css` | Admin pages styling |
| `styles/auth.css` | Login/Register styling |
| `styles/borrow-history.css` | Borrow history styling |
| `styles/borrow-schedule.css` | Borrow schedule styling |
| `styles/fines.css` | Fines page styling |
| `styles/home.css` | Home page styling |
| `styles/library-card.css` | Library card styling |
| `styles/navigation.css` | Navigation styling |
| `styles/profile.css` | Profile page styling |
| `App.css` | App-wide styles |

#### Documentation
| File | Purpose |
|------|---------|
| `README.md` | Frontend setup & overview |
| `AUTHENTICATION_GUIDE.md` | Detailed auth implementation guide |
| `PROJECT_STRUCTURE.md` | This file |

---

## Installation & Running

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev  # or: npm start
```

**Backend runs on:** `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

**Frontend runs on:** `http://localhost:3000`

---

## API Integration

### Base URL
```
http://localhost:5000/api
```

### Auth Endpoints Used
- `POST /api/auth/signup` - Register
- `POST /api/auth/signin` - Login
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/auth/verify` - Verify token

### Token Management
- **Access Token**: 24 hours validity
- **Refresh Token**: 48 hours validity
- **Storage**: localStorage
- **Header**: `x-access-token` or `Authorization: Bearer <token>`

---

## Key Features

✅ **Authentication**
- Login form with validation
- Register form with validation
- Token management (save/refresh/delete)
- Auto-logout on invalid token
- Protected routes

✅ **User Experience**
- Responsive design (mobile-friendly)
- Loading states
- Error handling & messaging
- Password show/hide toggle
- Form validation feedback

✅ **Code Quality**
- Axios interceptors
- Service layer pattern
- Protected routing
- Error boundary ready
- Clean folder structure

---

## Next Steps

### Immediate (Phase 2)
1. [ ] Create Books service & page
2. [ ] Create Loans service & page
3. [ ] Add navigation sidebar
4. [ ] Create dashboard page
5. [ ] Add user profile page

### Medium Term (Phase 3)
1. [ ] Fine management pages
2. [ ] Admin dashboard
3. [ ] Search functionality
4. [ ] Pagination components
5. [ ] Modal dialogs
6. [ ] Toast notifications

### Long Term (Phase 4)
1. [ ] State management (Context/Redux)
2. [ ] Dark mode support
3. [ ] Unit tests
4. [ ] E2E tests
5. [ ] Performance optimization
6. [ ] CI/CD pipeline

---

## Important Notes

### Security
⚠️ Never commit `.env` file with sensitive data
⚠️ Always use HTTPS in production
⚠️ Validate all user input
⚠️ Clear tokens on logout

### Development
📝 Update API URL in `.env` for different environments
📝 Use Redux DevTools for state debugging (if using Redux)
📝 Check Browser DevTools Network tab for API calls
📝 Use Postman to test backend APIs

### Deployment
🚀 Build: `npm run build`
🚀 Serve: `npx serve -s build`
🚀 Use environment variables for API URLs
🚀 Enable CORS on backend for frontend domain

---

Created: 2026-04-06
Version: 1.0
