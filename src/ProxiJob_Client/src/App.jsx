import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./admin/ToastContext";
import { useAuth } from "./auth/AuthContext";

// Auth Portal
import Login from "./auth/Login";
import Register from "./auth/Register";

// Student Portal
import StudentLayout from "./student/StudentLayout";

// Employer Portal
import EmployerLayout from "./employer/EmployerLayout";

// Admin Imports
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/AdminLogin";
import Dashboard from "./admin/Dashboard";
import PaymentManagement from "./admin/PaymentManagement";
import UserManagement from "./admin/UserManagement";
import SubscriptionManagement from "./admin/SubscriptionManagement";
import JobManagement from "./admin/JobManagement";

// Role-based Route Guard
function PrivateRoute({ allowedRole, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { user } = useAuth();

  return (
    <ToastProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <PrivateRoute allowedRole="student">
              <StudentLayout />
            </PrivateRoute>
          }
        />

        {/* Employer Routes */}
        <Route
          path="/employer/*"
          element={
            <PrivateRoute allowedRole="employer">
              <EmployerLayout />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route path="jobs" element={<JobManagement />} />
        </Route>

        {/* Home Routing logic */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "student" ? (
                <Navigate to="/student" replace />
              ) : (
                <Navigate to="/employer" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Redirect all other paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;

