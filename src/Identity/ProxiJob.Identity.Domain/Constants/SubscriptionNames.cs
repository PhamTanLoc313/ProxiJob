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

        // Student paid plans
        public const string Student10 = "Student10";

        public static readonly string[] AllBusinessPlans = { PerShift, Recruit, HrmBasic, Enterprise };
        public static readonly string[] AllStudentPlans = { Student10 };
        public static readonly string[] AllPaidPlans = { PerShift, Recruit, HrmBasic, Enterprise, Student10 };
    }
}
