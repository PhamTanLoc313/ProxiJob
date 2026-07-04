using ProxiJob.Identity.Application.DTOs;
using ProxiJob.Identity.Domain.Models;

namespace ProxiJob.Identity.Application.Common.Interfaces
{
    public class PayOsWebhookResult
    {
        public bool Success { get; set; }
        public long OrderCode { get; set; }
        public string? TransactionId { get; set; }
        public string? Description { get; set; }
    }

    public interface IPayOsPaymentService
    {
        /// <summary>Tạo payment link trên PayOS với đầy đủ thông tin đơn hàng</summary>
        Task<PayOsCreatePaymentResult> CreatePaymentLinkAsync(
            PaymentOrder order,
            string description,
            string returnUrl,
            string cancelUrl,
            CancellationToken cancellationToken = default);

        /// <summary>Xác thực và parse dữ liệu webhook từ PayOS</summary>
        Task<PayOsWebhookResult> VerifyWebhookDataAsync(string webhookBody, CancellationToken cancellationToken = default);
    }
}
