import { mockSubscriptions, formatCurrency } from "./adminData";
import { PackageCheck, Users } from "lucide-react";

export default function SubscriptionManagement() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>Gói dịch vụ</h2>
          <p style={{ fontSize: 14, color: "var(--admin-text-secondary)", margin: 0 }}>Quản lý các gói thuê bao cung cấp cho chủ quán.</p>
        </div>
      </div>

      <div className="admin-sub-cards">
        {mockSubscriptions.map((sub) => (
          <div key={sub.id} className={`admin-sub-card ${sub.hasPriorityDisplay ? "admin-sub-card-popular" : ""}`}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>{sub.name}</h3>
            <p style={{ fontSize: 13, color: "var(--admin-text-secondary)", margin: 0, minHeight: 40 }}>
              {sub.description}
            </p>
            
            <div className="admin-sub-price">
              {sub.price === 0 ? "Miễn phí" : formatCurrency(sub.price)}
              {sub.price > 0 && <span className="admin-sub-price-unit">/{sub.billingType === "Monthly" ? "tháng" : "ca"}</span>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderTop: "1px solid var(--admin-border)", borderBottom: "1px solid var(--admin-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--admin-text)" }}>
                <Users size={16} color="var(--admin-primary)" />
                <strong>{sub.activeUsers}</strong> users
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--admin-text)" }}>
                <PackageCheck size={16} color="var(--admin-success)" />
                Limit: <strong>{sub.jobPostLimit}</strong>
              </div>
            </div>

            <ul className="admin-sub-features">
              {sub.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
