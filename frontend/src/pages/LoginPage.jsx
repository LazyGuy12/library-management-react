import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import '../styles/auth.css';

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mssv: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Xóa lỗi khi user nhập
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation đơn giản
      if (!formData.mssv.trim()) {
        setError('Vui lòng nhập mã số sinh viên');
        setLoading(false);
        return;
      }
      if (!formData.password) {
        setError('Vui lòng nhập mật khẩu');
        setLoading(false);
        return;
      }

      const response = await authService.signin(formData);
      const data = response.data;

      // Lưu token vào localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        mssv: data.mssv,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      }));

      // Redirect đến trang chủ
      navigate('/');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError(
        err.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại MSSV và mật khẩu.'
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
          <h2>Đăng Nhập</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="mssv">Mã Số Sinh Viên</label>
            <input
              type="text"
              id="mssv"
              name="mssv"
              value={formData.mssv}
              onChange={handleChange}
              placeholder="Nhập mã số sinh viên"
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
                placeholder="Nhập mật khẩu"
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

          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="link">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
