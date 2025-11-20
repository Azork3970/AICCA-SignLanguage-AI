import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { login, register, loginWithGoogle, loginWithFacebook, loadProfile } from '../../redux/actions/authaction';
import './Login.css';

const Login = ({ notifyMsg }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (window.location.search.includes('token=')) {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const profile = {
          name: payload.name,
          userId: payload.userId,
          photoURL: payload.photoURL || null
        };
        Cookies.set('sign-language-ai-access-token', token, { expires: 2 });
        Cookies.set('sign-language-ai-user', JSON.stringify(profile), { expires: 2 });
        dispatch(loadProfile(profile, token));
        window.history.replaceState({}, document.title, window.location.pathname);
        notifyMsg('success', 'Đăng nhập thành công!');
        navigate('/');
      }
    }
  }, [dispatch, navigate, notifyMsg]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login
        await dispatch(login({
          email: formData.email,
          password: formData.password
        }));
        notifyMsg('success', 'Đăng nhập thành công!');
        navigate('/');
      } else {
        // Register
        await dispatch(register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }));
        notifyMsg('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        setIsLogin(true);
        setFormData({
          name: '',
          email: formData.email, // Keep email for login
          password: '',
          confirmPassword: ''
        });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isLogin ? 'Đăng nhập thất bại' : 'Đăng ký thất bại');
      notifyMsg('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend OAuth route which will redirect to Google
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/google`;
  };

  const handleFacebookLogin = () => {
    // Redirect to backend OAuth route which will redirect to Facebook
    window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/facebook`;
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
          <p>Chào mừng bạn đến với ứng dụng nhận dạng ngôn ngữ ký hiệu</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Họ và tên"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          )}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner"></div>
            ) : (
              isLogin ? 'Đăng Nhập' : 'Đăng Ký'
            )}
          </button>
        </form>

        <div className="divider">
          <span>hoặc</span>
        </div>

        <div className="social-login">
          <button
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
          >
            <img src="/assests/google.png" alt="Google" className="google-icon" />
            Đăng nhập với Google
          </button>

          <button
            className="facebook-login-btn"
            onClick={handleFacebookLogin}
            disabled={loading}
            type="button"
          >
            <img src="/assests/facebook_icon.png" alt="Facebook" className="facebook-icon" />
            Đăng nhập với Facebook
          </button>
        </div>

        <div className="login-footer">
          <p>
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button
              type="button"
              className="toggle-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setFormData({
                  name: '',
                  email: '',
                  password: '',
                  confirmPassword: ''
                });
              }}
            >
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
          <p>Bằng cách {isLogin ? 'đăng nhập' : 'đăng ký'}, bạn đồng ý với <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a></p>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Login;
