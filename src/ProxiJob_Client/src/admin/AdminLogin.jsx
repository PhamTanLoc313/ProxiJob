import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { adminLogin, getAdminSession } from "./adminData";
import logoImg from "../assets/logoproxijobcamden.png";
import { useToast } from "./ToastContext";
import "./admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  
  useEffect(() => {
    if (sessionStorage.getItem("logoutSuccess") === "true") {
      toast.success("Đăng xuất tài khoản quản trị thành công!");
      sessionStorage.removeItem("logoutSuccess");
    }
  }, [toast]);

  const [email, setEmail] = useState("admin@proxijob.test");
  const [password, setPassword] = useState("Password1!");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect to admin dashboard
  if (getAdminSession()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ email: "", password: "" });

    const errors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      errors.email = "Email admin không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Địa chỉ email không đúng định dạng.";
      }
    }

    if (!trimmedPassword) {
      errors.password = "Mật khẩu không được để trống.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await adminLogin(trimmedEmail, trimmedPassword);
      if (res.ok) {
        toast.success("Đăng nhập Admin thành công!");
        navigate("/admin");
      } else {
        toast.error(res.message || "Tên tài khoản hoặc mật khẩu không chính xác.");
        setError(res.message);
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.message || "Lỗi hệ thống khi đăng nhập.");
      setError(err.message || "Đăng nhập lỗi.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page admin-root">
      {/* Background decorative elements */}
      <div className="admin-bg-decor admin-decor-1"></div>
      <div className="admin-bg-decor admin-decor-2"></div>

      <div className="admin-login-card-wrapper">
        
        {/* Left Side: Form */}
        <div className="admin-login-form-pane">
          <div className="admin-login-brand">
            <img src={logoImg} alt="ProxiJob Logo" />
            <span>ProxiJob</span>
          </div>

          <div className="admin-login-form-content">
            <div className="admin-login-header">
              <h1 className="admin-login-title">Chào bạn!</h1>
              <p className="admin-login-subtitle">Nhập email và mật khẩu tài khoản Admin để truy cập hệ thống quản trị.</p>
            </div>

            {error && <div className="admin-login-error">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <div className="admin-form-group">
                <input
                  type="email"
                  className={`admin-form-input ${fieldErrors.email ? "admin-input-error-state" : ""}`}
                  placeholder="Địa chỉ email admin"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                  }}
                  disabled={loading}
                />
                {fieldErrors.email && <span className="admin-field-error-msg">{fieldErrors.email}</span>}
              </div>
              
              <div className="admin-form-group" style={{ marginBottom: 24, position: "relative" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`admin-form-input ${fieldErrors.password ? "admin-input-error-state" : ""}`}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                    }}
                    disabled={loading}
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--admin-text-muted)",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="admin-field-error-msg">{fieldErrors.password}</span>}
              </div>

              <button
                type="submit"
                className="admin-login-btn"
                disabled={loading}
              >
                {loading ? "Đang kết nối..." : "Đăng nhập"}
              </button>
            </form>
          </div>

          <div className="admin-login-footer">
            <span>Bạn gặp sự cố? </span>
            <a href="mailto:support@proxijob.vn">Liên hệ hỗ trợ</a>
          </div>
        </div>

        {/* Right Side: Visual & Glass Quote */}
        <div className="admin-login-image-pane">
          <div className="admin-login-image-overlay"></div>
          <div className="admin-login-glass-card">
            <span className="admin-glass-tag">💡 ProxiJob Insight</span>
            <h3>Giải pháp quản trị nhân sự hyperlocal tối ưu</h3>
            <p>Hệ thống tự động đồng bộ hóa lịch làm việc, quản lý chấm công bằng QR Code định vị và đối soát thanh toán lương tức thì.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
