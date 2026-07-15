import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./admin/ToastContext";

// Admin Imports
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/AdminLogin";
import Dashboard from "./admin/Dashboard";
import PaymentManagement from "./admin/PaymentManagement";
import UserManagement from "./admin/UserManagement";
import SubscriptionManagement from "./admin/SubscriptionManagement";
import JobManagement from "./admin/JobManagement";

function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route path="jobs" element={<JobManagement />} />
        </Route>

        {/* Redirect all other paths to admin dashboard */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
