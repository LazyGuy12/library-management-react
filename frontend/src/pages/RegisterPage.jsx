import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mssv: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Xóa lỗi khi user nhập
  };

  const validateForm = () => {
    if (!formData.mssv.trim()) {
      setError('Vui lòng nhập mã số sinh viên');
      return false;
    }
    if (!/^[0-9]{8,10}$/.test(formData.mssv)) {
      setError('Mã số sinh viên phải là 8-10 chữ số');
      return false;
    }
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ tên');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email không hợp lệ');
      return false;
    }
    if (!formData.password) {
      setError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await authService.signup({
        mssv: formData.mssv,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
      });

      const data = response.data;

      // Tự động đăng nhập sau khi đăng ký
      localStorage.setItem('accessToken', data.accessToken || '');
      localStorage.setItem('refreshToken', data.refreshToken || '');
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        mssv: data.user.mssv,
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
      }));

      // Redirect đến trang chủ
      navigate('/');
    } catch (err) {
      console.error('Lỗi đăng ký:', err);
      setError(
        err.response?.data?.message ||
        'Đăng ký thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📚 Thư Viện</h1>
          <p>Hệ Thống Quản Lý Thư Viện</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Đăng Ký Tài Khoản</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Họ tên</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Ví dụ: Nguyễn Văn A"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="mssv">Mã Số Sinh Viên</label>
            <input
              type="text"
              id="mssv"
              name="mssv"
              value={formData.mssv}
              onChange={handleChange}
              placeholder="Ví dụ: 20200123 (8-10 chữ số)"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ví dụ: a@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tối thiểu 6 ký tự"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="link">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
