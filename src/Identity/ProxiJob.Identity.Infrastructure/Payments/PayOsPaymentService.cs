using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.DTOs;
using ProxiJob.Identity.Domain.Models;

namespace ProxiJob.Identity.Infrastructure.Payments
{
    public class PayOsPaymentService : IPayOsPaymentService
    {
        private readonly PayOSClient _payOs;

        public PayOsPaymentService(IOptions<PayOsSettings> settingsOptions)
        {
            var settings = settingsOptions.Value;
            _payOs = new PayOSClient(settings.ClientId, settings.ApiKey, settings.ChecksumKey, null);
        }

        public async Task<PayOsCreatePaymentResult> CreatePaymentLinkAsync(
            PaymentOrder order,
            string description,
            string returnUrl,
            string cancelUrl,
            CancellationToken cancellationToken = default)
        {
            if (order.PayOsOrderCode == null)
                throw new ArgumentException("PayOsOrderCode cannot be null");

            var amount = (long)Math.Round(order.Amount);
            var safeDescription = description.Length > 25 ? description.Substring(0, 25) : description;

            var request = new CreatePaymentLinkRequest
            {
                OrderCode = order.PayOsOrderCode.Value,
                Amount = amount,
                Description = safeDescription,
                ReturnUrl = returnUrl,
                CancelUrl = cancelUrl
            };

            var response = await _payOs.PaymentRequests.CreateAsync(request);

            return new PayOsCreatePaymentResult
            {
                CheckoutUrl = response.CheckoutUrl,
                QrCode = response.QrCode,
                PayOsOrderCode = order.PayOsOrderCode.Value,
                AccountNumber = response.AccountNumber,
                AccountName = response.AccountName,
                Bin = response.Bin
            };
        }

        public async Task<PayOsWebhookResult> VerifyWebhookDataAsync(string webhookBody, CancellationToken cancellationToken = default)
        {
            try
            {
                // Webhook body comes as JSON string. Deserialize it to Webhook model
                var webhook = System.Text.Json.JsonSerializer.Deserialize<Webhook>(webhookBody, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (webhook == null) return new PayOsWebhookResult { Success = false };

                var webhookData = await _payOs.Webhooks.VerifyAsync(webhook);

                return new PayOsWebhookResult
                {
                    Success = webhookData.Code == "00", // Success code usually "00"
                    OrderCode = webhookData.OrderCode,
                    TransactionId = webhookData.Reference,
                    Description = webhookData.Description
                };
            }
            catch (Exception)
            {
                // Verify failed or parsing failed
                return new PayOsWebhookResult { Success = false };
            }
        }

        public async Task<PayOsPaymentInfo?> GetPaymentInfoAsync(long orderCode, CancellationToken cancellationToken = default)
        {
            try
            {
                var paymentInfo = await _payOs.PaymentRequests.GetAsync(orderCode);
                if (paymentInfo == null) return null;

                return new PayOsPaymentInfo
                {
                    OrderCode = paymentInfo.OrderCode,
                    Status = paymentInfo.Status.ToString(),
                    TransactionId = paymentInfo.Id
                };
            }
            catch (Exception)
            {
                // PayOS API call failed — return null to skip auto-verify
                return null;
            }
        }
    }
}
