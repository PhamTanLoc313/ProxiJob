namespace ProxiJob.Identity.Domain.Constants
{
    public static class SubscriptionNames
    {
        /// <summary>Chưa mua gói — chủ quán đang dùng 3 lần đăng tin miễn phí.</summary>
        public const string Trial = "Trial";

        /// <summary>Sinh viên / không áp dụng gói B2B.</summary>
        public const string None = "None";

        public const string PerShift = "PerShift";
        public const string Recruit = "Recruit";
        public const string HrmBasic = "HRM Basic";
        public const string Enterprise = "Enterprise";

        public static readonly string[] AllPaidPlans = { PerShift, Recruit, HrmBasic, Enterprise };
    }
}
