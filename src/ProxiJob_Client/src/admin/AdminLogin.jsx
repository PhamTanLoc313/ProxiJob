import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { adminLogin, getAdminSession } from "./adminData";
import "./admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@proxijob.vn");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to admin dashboard
  if (getAdminSession()) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await adminLogin(email, password);
      if (res.ok) {
        navigate("/admin");
      } else {
        setError(res.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Đăng nhập lỗi.");
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-logo">P</div>
          <h1 className="admin-login-title">ProxiJob Admin</h1>
          <p className="admin-login-subtitle">Đăng nhập vào hệ thống quản trị</p>
        </div>

        {error && <div className="admin-login-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Email Admin</label>
            <input
              type="email"
              className="admin-form-input"
              placeholder="Nhập email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 28 }}>
            <label className="admin-form-label">Mật khẩu</label>
            <input
              type="password"
              className="admin-form-input"
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? (
              <span>Đang đăng nhập...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
