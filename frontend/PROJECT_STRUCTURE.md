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
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx        # 🔐 Login form
│   │   │   └── RegisterPage.jsx     # 📝 Register form
│   │   │
│   │   ├── services/
│   │   │   ├── axiosConfig.js       # Axios setup + interceptors
│   │   │   └── authService.js       # Auth API calls
│   │   │
│   │   ├── styles/
│   │   │   ├── auth.css             # Auth form styling
│   │   │   └── app.css              # App-wide styling
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

#### Pages (7 lines mỗi file)
| File | Purpose |
|------|---------|
| `pages/LoginPage.jsx` | Login form (~120 lines) |
| `pages/RegisterPage.jsx` | Register form (~150 lines) |

#### Services (Axios + Auth)
| File | Purpose |
|------|---------|
| `services/axiosConfig.js` | Axios config + interceptors |
| `services/authService.js` | Auth API methods |

#### Styling
| File | Purpose |
|------|---------|
| `styles/auth.css` | Login/Register styling |
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
