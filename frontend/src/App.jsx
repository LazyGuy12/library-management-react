import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import BorrowHistoryPage from './pages/BorrowHistoryPage';
import BorrowSchedulePage from './pages/BorrowSchedulePage';
import FinesPage from './pages/FinesPage';
import AdminBooksPage from './pages/AdminBooksPage';
import AdminLoansPage from './pages/AdminLoansPage';
import AdminCardsPage from './pages/AdminCardsPage';
import AdminFinesPage from './pages/AdminFinesPage';
import authService from './services/authService';
import './App.css';

// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await authService.verifyToken();
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.clear();
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borrow-history"
          element={
            <ProtectedRoute>
              <BorrowHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borrow-schedule"
          element={
            <ProtectedRoute>
              <BorrowSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fines"
          element={
            <ProtectedRoute>
              <FinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/books"
          element={
            <ProtectedRoute>
              <AdminBooksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/loans"
          element={
            <ProtectedRoute>
              <AdminLoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cards"
          element={
            <ProtectedRoute>
              <AdminCardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fines"
          element={
            <ProtectedRoute>
              <AdminFinesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
