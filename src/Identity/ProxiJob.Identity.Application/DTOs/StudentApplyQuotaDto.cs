namespace ProxiJob.Identity.Application.DTOs
{
    public class StudentApplyQuotaDto
    {
        public int AppliesLimit { get; set; }
        public int AppliesUsed { get; set; }
        public int AppliesRemaining { get; set; }
        public bool CanApply { get; set; }
    }
}
