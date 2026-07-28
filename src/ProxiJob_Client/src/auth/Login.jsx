import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { loginApi, registerApi, decodeJwt, storeAuthSession } from "../api/auth";
import { useAuth } from "./AuthContext";
import { useToast } from "../admin/ToastContext";
import { Eye, EyeOff, UserPlus, HelpCircle, GraduationCap, Store } from "lucide-react";
import logoImg from "../assets/logoproxijobcamden.png";
import "../admin/admin.css";
import { IDENTITY_API_BASE_URL } from "../api/apiConfig";

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
  const [showRoleModal, setShowRoleModal] = useState(false);

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

  const handleGoogleLogin = async (selectedRole) => {
    setShowRoleModal(false);
    setLoginLoading(true);
    setLoginError("");

    try {
      const backendLoginUrl = `${IDENTITY_API_BASE_URL}/auth/google-login?role=${selectedRole}`;
      
      const authData = await new Promise((resolve) => {
        const handler = (event) => {
          if (event.data?.type === "proxijob-google-auth") {
            window.removeEventListener("message", handler);
            resolve(event.data);
          } else if (event.data?.type === "proxijob-google-auth-error") {
            window.removeEventListener("message", handler);
            resolve({ error: decodeURIComponent(event.data.message || "") });
          }
        };
        window.addEventListener("message", handler);
        
        const popup = window.open(backendLoginUrl, "google-login", "width=500,height=700,left=200,top=100");
        
        // Timeout (5 min)
        setTimeout(() => {
          window.removeEventListener("message", handler);
          resolve(null);
        }, 300000);

        // Poll for popup close
        const pollClose = setInterval(() => {
          try {
            if (popup && popup.closed) {
              clearInterval(pollClose);
              window.removeEventListener("message", handler);
              resolve(null);
            }
          } catch (e) {}
        }, 1000);
      });

      if (!authData) {
        setLoginLoading(false);
        toast.info("Đăng nhập Google đã bị hủy hoặc hết thời gian.");
        return;
      }

      if (authData.error) {
        setLoginLoading(false);
        setLoginError(authData.error);
        toast.error(`Lỗi: ${authData.error}`);
        return;
      }

      const token = authData.token;

      if (token) {
        const decodedUser = decodeJwt(token);
        if (!decodedUser) {
          throw new Error("Không thể giải mã token.");
        }

        const rawRole = decodedUser["role"] || decodedUser["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
        const roleStr = (Array.isArray(rawRole) ? rawRole[0] : rawRole).toString();

        let mappedRole = "employer";
        if (roleStr.toLowerCase() === "student") {
          mappedRole = "student";
        } else if (roleStr.toLowerCase() === "admin") {
          mappedRole = "admin";
        }

        const userId = parseInt(decodedUser.sub || decodedUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 1, 10);
        const subTier = decodedUser["subscription_tier"] || "Free";
        const avatarUrl = decodedUser["avatar_url"] || "";

        const userObj = {
          id: userId,
          email: decodedUser.email || "",
          name: decodedUser.name || decodedUser.unique_name || decodedUser["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || (mappedRole === "student" ? "Sinh viên" : mappedRole === "admin" ? "Admin" : "Chủ quán"),
          role: mappedRole,
          subscriptionTier: subTier,
          avatarUrl: avatarUrl,
        };

        // Save token & user
        storeAuthSession(token, userObj);

        // Set React Auth State
        setCurrentUser(userObj);
        toast.success(`Đăng nhập Google thành công! Chào mừng ${userObj.name}.`);

        // Navigate
        if (userObj.role === "admin") {
          const adminSession = {
            token: token,
            email: userObj.email,
            fullName: userObj.name,
            role: "Admin",
            loginAt: new Date().toISOString(),
          };
          localStorage.setItem("proxijob_admin_session", JSON.stringify(adminSession));
          navigate("/admin");
        } else if (userObj.role === "student") {
          navigate("/student");
        } else {
          navigate("/employer");
        }
      } else {
        throw new Error("Không nhận được token từ hệ thống.");
      }
    } catch (err) {
      setLoginError(err.message || "Đăng nhập Google thất bại.");
      toast.error(err.message || "Đăng nhập Google thất bại.");
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

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", margin: "16px 0", gap: "8px" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}>Hoặc</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={() => setShowRoleModal(true)}
                  disabled={loginLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "44px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    gap: "10px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Tiếp tục với Google
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

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", margin: "12px 0", gap: "8px" }}>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "500" }}>Hoặc</span>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}></div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin(role === "restaurant" ? "employer" : "student")}
                  disabled={registerLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "40px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    fontWeight: "600",
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    gap: "8px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Đăng ký nhanh bằng Google
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

      {showRoleModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setShowRoleModal(false)}
        >
          <div 
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "460px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              border: "1px solid #f1f5f9",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
              Bạn đăng nhập với vai trò nào?
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.5", marginBottom: "24px" }}>
              Vui lòng chọn vai trò để ProxiJob cấu hình giao diện phù hợp với nhu cầu của bạn.
            </p>

            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: "12px" }}>
              {/* Option 1: Student */}
              <button
                type="button"
                onClick={() => handleGoogleLogin("student")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  width: "100%",
                  gap: "16px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ff6b00";
                  e.currentTarget.style.backgroundColor = "#fffaf5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <div style={{
                  backgroundColor: "#fff0e6",
                  borderRadius: "8px",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <GraduationCap size={24} color="#ff6b00" />
                </div>
                <div>
                  <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Sinh viên</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Tìm việc làm quanh đây kiếm thêm thu nhập</div>
                </div>
              </button>

              {/* Option 2: Employer */}
              <button
                type="button"
                onClick={() => handleGoogleLogin("employer")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  width: "100%",
                  gap: "16px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0f172a";
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                }}
              >
                <div style={{
                  backgroundColor: "#f1f5f9",
                  borderRadius: "8px",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Store size={24} color="#0f172a" />
                </div>
                <div>
                  <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>Chủ quán / Nhà tuyển dụng</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>Đăng tin tuyển nhân sự tức thì cho cửa hàng</div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRoleModal(false)}
              style={{
                marginTop: "20px",
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#64748b"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
