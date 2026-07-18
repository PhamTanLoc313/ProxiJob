import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { loginApi, registerApi, decodeJwt } from "../api/auth";
import { useAuth } from "./AuthContext";
import { useToast } from "../admin/ToastContext";
import { Eye, EyeOff, UserPlus, HelpCircle, GraduationCap, Store } from "lucide-react";
import logoImg from "../assets/logoproxijobcamden.png";
import "../admin/admin.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setCurrentUser } = useAuth();
  const toast = useToast();
  
  // Detect active form state based on URL route
  const isRegister = location.pathname === "/register";

  // Listen for redirect success messages & logouts and trigger toast
  useEffect(() => {
    if (location.state?.message) {
      const msg = location.state.message;
      // Clean history state so it does not fire again on reload
      navigate(location.pathname, { replace: true, state: {} });
      toast.success(msg);
    }

    const isLoggedOut = sessionStorage.getItem("logoutSuccess");
    if (isLoggedOut) {
      sessionStorage.removeItem("logoutSuccess");
      toast.success("Đăng xuất thành công! Hẹn gặp lại bạn.");
    }
  }, [location.state?.message, location.pathname, navigate]);

  // Login form states
  const [email, setEmail] = useState(location.state?.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginFieldErrors, setLoginFieldErrors] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form states
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student"); // student or restaurant
  const [registerError, setRegisterError] = useState("");
  const [registerFieldErrors, setRegisterFieldErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // If already logged in, redirect based on role
  if (user) {
    if (user.role === "admin") {
      const adminSession = localStorage.getItem("proxijob_admin_session");
      if (adminSession) {
        return <Navigate to="/admin" replace />;
      } else {
        // Self-healing: Admin session is missing, so clear regular auth session to prevent infinite loop
        localStorage.removeItem("@proxijob_auth_token");
        localStorage.removeItem("@proxijob_auth_user");
        // Clear React Auth state
        setTimeout(() => setCurrentUser(null), 0);
        return null;
      }
    }
    if (user.role === "student") return <Navigate to="/student" replace />;
    return <Navigate to="/employer" replace />;
  }

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginFieldErrors({ email: "", password: "" });

    const errors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      errors.email = "Email không được để trống.";
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
      setLoginFieldErrors(errors);
      return;
    }

    setLoginLoading(true);

    try {
      const result = await loginApi(trimmedEmail, trimmedPassword);
      
      const decodedUser = decodeJwt(result.token);
      const rawRole = decodedUser['role'] || decodedUser['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
      const roleStr = (Array.isArray(rawRole) ? rawRole[0] : rawRole).toString();

      if (roleStr.toLowerCase() === "admin") {
        const adminSession = {
          token: result.token,
          email: decodedUser.email || trimmedEmail,
          fullName: decodedUser.name || "Admin",
          role: "Admin",
          loginAt: new Date().toISOString(),
        };
        localStorage.setItem("proxijob_admin_session", JSON.stringify(adminSession));
        
        setCurrentUser(result.user);
        toast.success("Đăng nhập thành công! Chào mừng quay trở lại.");
        navigate("/admin");
      } else {
        setCurrentUser(result.user);
        toast.success("Đăng nhập thành công! Chào mừng quay trở lại.");
        if (result.user.role === "student") {
          navigate("/student");
        } else {
          navigate("/employer");
        }
      }
    } catch (err) {
      setLoginError(err.message || "Đăng nhập thất bại.");
      toast.error(err.message || "Đăng nhập thất bại.");
      setLoginLoading(false);
    }
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setRegisterFieldErrors({});

    const errors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = registerEmail.trim();
    const trimmedPassword = registerPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedName) {
      errors.fullName = "Họ và tên không được để trống.";
    }

    if (!trimmedEmail) {
      errors.email = "Email không được để trống.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Địa chỉ email không đúng định dạng.";
      }
    }

    if (!trimmedPassword) {
      errors.password = "Mật khẩu không được để trống.";
    } else if (trimmedPassword.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    if (!trimmedConfirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    } else if (trimmedPassword !== trimmedConfirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp.";
    }

    if (Object.keys(errors).length > 0) {
      setRegisterFieldErrors(errors);
      return;
    }

    setRegisterLoading(true);

    try {
      const userType = role === "student" ? 0 : 1;
      await registerApi(trimmedName, trimmedEmail, trimmedPassword, trimmedConfirmPassword, userType);
      
      setRegisterLoading(false);
      
      // Clear registration form
      setFullName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
      
      navigate("/login", {
        state: {
          registeredEmail: trimmedEmail,
          message: "Đăng ký tài khoản thành công! Mời bạn đăng nhập.",
        },
      });
    } catch (err) {
      setRegisterError(err.message || "Đăng ký thất bại.");
      toast.error(err.message || "Đăng ký thất bại.");
      setRegisterLoading(false);
    }
  };

  return (
    <div className="admin-login-page admin-root">
      {/* Background decorative elements */}
      <div className="admin-bg-decor admin-decor-1"></div>
      <div className="admin-bg-decor admin-decor-2"></div>

      <div className="admin-login-card-wrapper" style={{ position: "relative" }}>
        
        {/* ==================== LEFT SIDE: LOGIN FORM ==================== */}
        <div className={`auth-form-container ${isRegister ? "hidden-mobile" : ""}`} style={{ opacity: isRegister ? 0 : 1, pointerEvents: isRegister ? "none" : "auto" }}>
          <div className="admin-login-form-pane">
            <div className="admin-login-brand">
              <img src={logoImg} alt="ProxiJob Logo" />
              <span>ProxiJob</span>
            </div>

            <div className="admin-login-form-content">
              <div className="admin-login-header">
                <h1 className="admin-login-title">Chào bạn!</h1>
                <p className="admin-login-subtitle">Nhập email và mật khẩu tài khoản ProxiJob của bạn để tiếp tục.</p>
              </div>

              {loginError && <div className="admin-login-error">{loginError}</div>}

              <form onSubmit={handleLoginSubmit} noValidate>
                <div className="admin-form-group">
                  <input
                    type="email"
                    className={`admin-form-input ${loginFieldErrors.email ? "admin-input-error-state" : ""}`}
                    placeholder="Địa chỉ email của bạn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginFieldErrors.email) setLoginFieldErrors(prev => ({ ...prev, email: "" }));
                    }}
                    disabled={loginLoading}
                  />
                  {loginFieldErrors.email && <span className="admin-field-error-msg">{loginFieldErrors.email}</span>}
                </div>
                
                <div className="admin-form-group" style={{ marginBottom: 24, position: "relative" }}>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      className={`admin-form-input ${loginFieldErrors.password ? "admin-input-error-state" : ""}`}
                      placeholder="Mật khẩu"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginFieldErrors.password) setLoginFieldErrors(prev => ({ ...prev, password: "" }));
                      }}
                      disabled={loginLoading}
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
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
                      {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginFieldErrors.password && <span className="admin-field-error-msg">{loginFieldErrors.password}</span>}
                </div>

                <button
                  type="submit"
                  className="admin-login-btn"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Đang kết nối..." : "Đăng nhập"}
                </button>
              </form>
            </div>

            <div 
              className="login-footer" 
              style={{ 
                marginTop: "40px", 
                paddingTop: "24px", 
                borderTop: "1px dashed #e2e8f0", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                flexWrap: "wrap", 
                gap: "16px" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Chưa có tài khoản?</span>
                <Link 
                  to="/register" 
                  style={{ 
                    color: "#ff6b00", 
                    fontWeight: "700", 
                    textDecoration: "none", 
                    fontSize: "13px", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "4px",
                    transition: "all 0.2s ease"
                  }}
                  className="hover-underline-link"
                >
                  <UserPlus size={14} />
                  Đăng ký ngay
                </Link>
              </div>
              
              <a 
                href="mailto:support@proxijob.vn" 
                style={{ 
                  color: "#64748b", 
                  textDecoration: "none", 
                  fontSize: "13px", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "4px",
                  transition: "all 0.2s ease",
                  fontWeight: "500"
                }}
                className="hover-color-link"
              >
                <HelpCircle size={14} />
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT SIDE: REGISTER FORM ==================== */}
        <div className={`auth-form-container ${!isRegister ? "hidden-mobile" : ""}`} style={{ opacity: isRegister ? 1 : 0, pointerEvents: isRegister ? "auto" : "none" }}>
          <div className="admin-login-form-pane" style={{ padding: "40px 48px" }}>
            <div className="admin-login-brand" style={{ marginBottom: "8px" }}>
              <img src={logoImg} alt="ProxiJob Logo" />
              <span>ProxiJob</span>
            </div>

            <div className="admin-login-form-content">
              <div className="admin-login-header" style={{ marginBottom: "16px" }}>
                <h1 className="admin-login-title" style={{ fontSize: "24px" }}>Đăng ký</h1>
                <p className="admin-login-subtitle">Tạo tài khoản mới để bắt đầu sử dụng hệ thống.</p>
              </div>

              {registerError && <div className="admin-login-error" style={{ marginBottom: "12px", padding: "10px 14px" }}>{registerError}</div>}

              <form onSubmit={handleRegisterSubmit} noValidate>
                {/* Role Tabs */}
                <div className="admin-form-group" style={{ marginBottom: "12px" }}>
                  <label className="text-sm font-semibold text-slate-700 mb-1 block" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                    Bạn là
                  </label>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`role-toggle-btn ${role === "student" ? "active" : ""}`}
                      style={{ height: "42px", fontSize: "13px" }}
                    >
                      <GraduationCap size={15} />
                      Sinh viên
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("restaurant")}
                      className={`role-toggle-btn ${role === "restaurant" ? "active" : ""}`}
                      style={{ height: "42px", fontSize: "13px" }}
                    >
                      <Store size={15} />
                      Chủ nhà hàng
                    </button>
                  </div>
                </div>

                {/* Grid for Name & Email (Row 1) */}
                <div style={{ display: "flex", gap: "16px" }}>
                  {/* Full name input */}
                  <div className="admin-form-group" style={{ flex: 1, marginBottom: "12px" }}>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      className={`admin-form-input ${registerFieldErrors.fullName ? "admin-input-error-state" : ""}`}
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (registerFieldErrors.fullName) setRegisterFieldErrors(prev => ({ ...prev, fullName: "" }));
                      }}
                      disabled={registerLoading}
                      style={{ height: "42px", fontSize: "13.5px" }}
                    />
                    {registerFieldErrors.fullName && <span className="admin-field-error-msg">{registerFieldErrors.fullName}</span>}
                  </div>

                  {/* Email input */}
                  <div className="admin-form-group" style={{ flex: 1, marginBottom: "12px" }}>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      className={`admin-form-input ${registerFieldErrors.email ? "admin-input-error-state" : ""}`}
                      placeholder="stu@gmail.com"
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        if (registerFieldErrors.email) setRegisterFieldErrors(prev => ({ ...prev, email: "" }));
                      }}
                      disabled={registerLoading}
                      style={{ height: "42px", fontSize: "13.5px" }}
                    />
                    {registerFieldErrors.email && <span className="admin-field-error-msg">{registerFieldErrors.email}</span>}
                  </div>
                </div>
                
                {/* Grid for Password & Confirm (Row 2) */}
                <div style={{ display: "flex", gap: "16px" }}>
                  {/* Password input */}
                  <div className="admin-form-group" style={{ flex: 1, position: "relative", marginBottom: "12px" }}>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                      Mật khẩu
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        className={`admin-form-input ${registerFieldErrors.password ? "admin-input-error-state" : ""}`}
                        placeholder="•••••••••"
                        value={registerPassword}
                        onChange={(e) => {
                          setRegisterPassword(e.target.value);
                          if (registerFieldErrors.password) setRegisterFieldErrors(prev => ({ ...prev, password: "" }));
                        }}
                        disabled={registerLoading}
                        style={{ paddingRight: "44px", height: "42px", fontSize: "13.5px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
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
                        {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerFieldErrors.password && <span className="admin-field-error-msg">{registerFieldErrors.password}</span>}
                  </div>

                  {/* Confirm password input */}
                  <div className="admin-form-group" style={{ flex: 1, position: "relative", marginBottom: "12px" }}>
                    <label className="text-sm font-semibold text-slate-700 mb-1 block" style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                      Xác nhận mật khẩu
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showRegisterConfirmPassword ? "text" : "password"}
                        className={`admin-form-input ${registerFieldErrors.confirmPassword ? "admin-input-error-state" : ""}`}
                        placeholder="Nhập lại mật khẩu"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (registerFieldErrors.confirmPassword) setRegisterFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                        }}
                        disabled={registerLoading}
                        style={{ paddingRight: "44px", height: "42px", fontSize: "13.5px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
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
                        {showRegisterConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {registerFieldErrors.confirmPassword && <span className="admin-field-error-msg">{registerFieldErrors.confirmPassword}</span>}
                  </div>
                </div>

                {/* Actions (Tạo tài khoản) */}
                <button
                  type="submit"
                  className="admin-login-btn"
                  disabled={registerLoading}
                  style={{ width: "100%", height: "44px", marginTop: "16px" }}
                >
                  {registerLoading ? "Đang xử lý..." : "Tạo tài khoản"}
                </button>
              </form>
            </div>

            <div 
              className="login-footer" 
              style={{ 
                marginTop: "32px", 
                paddingTop: "16px", 
                borderTop: "1px dashed #e2e8f0", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                flexWrap: "wrap", 
                gap: "12px" 
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#64748b", fontSize: "13px" }}>Đã có tài khoản?</span>
                <Link 
                  to="/login" 
                  style={{ 
                    color: "#ff6b00", 
                    fontWeight: "700", 
                    textDecoration: "none", 
                    fontSize: "13px", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "4px",
                    transition: "all 0.2s ease"
                  }}
                  className="hover-underline-link"
                >
                  Đăng nhập ngay
                </Link>
              </div>
              
              <a 
                href="mailto:support@proxijob.vn" 
                style={{ 
                  color: "#64748b", 
                  textDecoration: "none", 
                  fontSize: "13px", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "4px",
                  transition: "all 0.2s ease",
                  fontWeight: "500"
                }}
                className="hover-color-link"
              >
                <HelpCircle size={14} />
                Liên hệ hỗ trợ
              </a>
            </div>
          </div>
        </div>

        {/* ==================== SLIDING OVERLAY (VISUAL PANEL) ==================== */}
        <div className={`sliding-overlay ${isRegister ? "state-register" : "state-login"}`}>
          <div className="admin-login-image-pane" style={{ height: "100%", width: "100%" }}>
            <div className="admin-login-image-overlay"></div>
            <div className="admin-login-glass-card" style={{ marginTop: "40px" }}>
              <span className="admin-glass-tag">💡 ProxiJob Insight</span>
              <h3>Giải pháp quản trị nhân sự hyperlocal tối ưu</h3>
              <p>Hệ thống tự động đồng bộ hóa lịch làm việc, quản lý chấm công bằng QR Code định vị và đối soát thanh toán lương tức thì.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
