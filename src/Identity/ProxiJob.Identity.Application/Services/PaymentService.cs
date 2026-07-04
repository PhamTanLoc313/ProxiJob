using Microsoft.Extensions.Configuration;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.DTOs;
using ProxiJob.Identity.Domain.Constants;
using ProxiJob.Identity.Domain.Enums;
using ProxiJob.Identity.Domain.Models;

namespace ProxiJob.Identity.Application.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly ISubscriptionRepository _subscriptionRepository;
        private readonly IAuthRepository _authRepository;
        private readonly IAuthSessionService _authSessionService;
        private readonly IBankTransferPaymentService _bankTransfer;
        private readonly IPayOsPaymentService _payOs;
        private readonly IUnitOfWork _unitOfWork;
        private readonly string _publicBaseUrl;
        private readonly int _orderExpirationMinutes;

        public PaymentService(
            IPaymentRepository paymentRepository,
            ISubscriptionRepository subscriptionRepository,
            IAuthRepository authRepository,
            IAuthSessionService authSessionService,
            IBankTransferPaymentService bankTransfer,
            IPayOsPaymentService payOs,
            IUnitOfWork unitOfWork,
            IConfiguration configuration)
        {
            _paymentRepository = paymentRepository;
            _subscriptionRepository = subscriptionRepository;
            _authRepository = authRepository;
            _authSessionService = authSessionService;
            _bankTransfer = bankTransfer;
            _payOs = payOs;
            _unitOfWork = unitOfWork;
            _publicBaseUrl = configuration.GetValue("PaymentSettings:PublicBaseUrl", "https://localhost:7159")!;
            _orderExpirationMinutes = configuration.GetValue("BankTransfer:OrderExpirationMinutes", 1440);
        }

        public async Task<PurchasePlanResponseDto> InitiatePurchaseAsync(
            int userId,
            int planId,
            CancellationToken cancellationToken = default)
        {
            var plan = await _subscriptionRepository.GetByIdAsync(planId, cancellationToken)
                ?? throw new InvalidOperationException(BusinessMessages.PlanNotFound);

            if (!SubscriptionNames.AllPaidPlans.Contains(plan.Name))
                throw new InvalidOperationException(BusinessMessages.InvalidPlanId);

            var active = await _subscriptionRepository.GetActiveByUserIdAsync(userId, cancellationToken);
            if (active?.SubscriptionId == planId)
                throw new InvalidOperationException(BusinessMessages.AlreadyOnPlan);

            // Kiểm tra đơn pending đã có cho user+plan này
            var existingPending = await _paymentRepository.GetPendingByUserAndPlanAsync(userId, planId, cancellationToken);
            if (existingPending != null)
            {
                return MapPurchaseResponse(existingPending, BusinessMessages.PaymentOrderCreated);
            }

            var user = await _authRepository.GetUserByIdAsync(userId, cancellationToken)
                ?? throw new UnauthorizedAccessException(BusinessMessages.UserNotFound);

            // Tạo mã PayOS orderCode (long) — dùng timestamp + random
            var payOsOrderCode = GeneratePayOsOrderCode();

            var order = new PaymentOrder
            {
                OrderCode = $"PJ{DateTime.UtcNow:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}",
                UserId = userId,
                SubscriptionId = planId,
                Amount = plan.Price,
                Gateway = PaymentGatewayType.PayOS,
                Status = PaymentOrderStatus.Pending,
                ExpiresAt = DateTime.UtcNow.AddMinutes(_orderExpirationMinutes),
                CreatedBy = user.Email,
                PayOsOrderCode = payOsOrderCode
            };

            // Gọi PayOS tạo payment link
            var returnUrl = $"{_publicBaseUrl}/api/payments/payos/return?orderCode={payOsOrderCode}";
            var cancelUrl = $"{_publicBaseUrl}/api/payments/payos/cancel?orderCode={payOsOrderCode}";
            var description = order.OrderCode;

            var payOsResult = await _payOs.CreatePaymentLinkAsync(order, description, returnUrl, cancelUrl, cancellationToken);

            order.PaymentUrl = $"{payOsResult.CheckoutUrl}|{payOsResult.QrCode}|{payOsResult.AccountNumber}|{payOsResult.AccountName}|{payOsResult.Bin}|{description}";
            order.GatewayTransactionId = payOsOrderCode.ToString();

            await _paymentRepository.AddAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return MapPurchaseResponse(order, BusinessMessages.PaymentOrderCreated, payOsResult.CheckoutUrl, payOsResult.QrCode);
        }

        public async Task<PaymentOrderStatusDto> GetOrderStatusAsync(int orderId, int userId, CancellationToken cancellationToken = default)
        {
            var order = await GetOwnedOrderAsync(orderId, userId, cancellationToken);
            await ExpireIfNeededAsync(order, cancellationToken);
            return await MapStatusAsync(order, cancellationToken);
        }

        public async Task<AuthTokensDto?> IssueTokensIfPaidAsync(int orderId, int userId, CancellationToken cancellationToken = default)
        {
            var order = await GetOwnedOrderAsync(orderId, userId, cancellationToken);
            await ExpireIfNeededAsync(order, cancellationToken);

            if (order.Status != PaymentOrderStatus.Paid)
                return null;

            var user = await _authRepository.GetUserByIdAsync(userId, cancellationToken);
            return user == null ? null : await _authSessionService.IssueSessionAsync(user, cancellationToken);
        }

        public async Task<IReadOnlyList<AdminPaymentOrderDto>> GetPendingBankTransferOrdersAsync(CancellationToken cancellationToken = default)
        {
            // Lấy cả đơn BankTransfer và PayOS pending
            var orders = await _paymentRepository.GetByStatusAsync(
                PaymentOrderStatus.Pending, null, cancellationToken);

            var result = new List<AdminPaymentOrderDto>();
            foreach (var order in orders)
            {
                await ExpireIfNeededAsync(order, cancellationToken);
                if (order.Status == PaymentOrderStatus.Pending)
                    result.Add(await MapAdminOrderAsync(order, cancellationToken));
            }

            return result;
        }

        public async Task<AdminPaymentOrderDto> ConfirmBankTransferOrderAsync(
            int orderId,
            string adminEmail,
            string? adminNote,
            CancellationToken cancellationToken = default)
        {
            var order = await _paymentRepository.GetByIdAsync(orderId, cancellationToken)
                ?? throw new InvalidOperationException(BusinessMessages.PaymentOrderNotFound);

            if (order.Status == PaymentOrderStatus.Paid)
                return await MapAdminOrderAsync(order, cancellationToken);

            await ExpireIfNeededAsync(order, cancellationToken);
            if (order.Status == PaymentOrderStatus.Expired)
                throw new InvalidOperationException(BusinessMessages.PaymentOrderExpired);
            if (order.Status != PaymentOrderStatus.Pending)
                throw new InvalidOperationException(BusinessMessages.PaymentOrderNotPending);

            await CompletePaidOrderAsync(order, order.OrderCode, adminEmail, adminNote, cancellationToken);
            return await MapAdminOrderAsync(order, cancellationToken);
        }

        public async Task<AdminPaymentOrderDto> RejectBankTransferOrderAsync(
            int orderId,
            string adminEmail,
            string? adminNote,
            CancellationToken cancellationToken = default)
        {
            var order = await _paymentRepository.GetByIdAsync(orderId, cancellationToken)
                ?? throw new InvalidOperationException(BusinessMessages.PaymentOrderNotFound);

            if (order.Status != PaymentOrderStatus.Pending)
                throw new InvalidOperationException(BusinessMessages.PaymentOrderNotPending);

            order.Status = PaymentOrderStatus.Cancelled;
            order.FailureReason = adminNote ?? "Admin từ chối đơn thanh toán.";
            order.ConfirmedBy = adminEmail;
            order.AdminNote = adminNote;
            order.UpdatedAt = DateTime.UtcNow;
            order.UpdatedBy = adminEmail;

            await _paymentRepository.UpdateAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return await MapAdminOrderAsync(order, cancellationToken);
        }

        public async Task HandlePayOsWebhookAsync(string webhookBody, CancellationToken cancellationToken = default)
        {
            var result = await _payOs.VerifyWebhookDataAsync(webhookBody, cancellationToken);
            if (!result.Success)
                return;

            var order = await _paymentRepository.GetByPayOsOrderCodeAsync(result.OrderCode, cancellationToken);
            if (order == null || order.Status != PaymentOrderStatus.Pending)
                return;

            await CompletePaidOrderAsync(order, result.TransactionId, "PayOS Webhook", $"PayOS auto-confirm: {result.Description}", cancellationToken);
        }

        private async Task CompletePaidOrderAsync(
            PaymentOrder order,
            string? gatewayTransactionId,
            string? confirmedBy,
            string? adminNote,
            CancellationToken cancellationToken)
        {
            var user = await _authRepository.GetUserByIdAsync(order.UserId, cancellationToken)
                ?? throw new InvalidOperationException(BusinessMessages.UserNotFound);

            await _subscriptionRepository.SubscribeToPlanByIdAsync(
                order.UserId, order.SubscriptionId, user.Email, cancellationToken);

            order.Status = PaymentOrderStatus.Paid;
            order.PaidAt = DateTime.UtcNow;
            order.GatewayTransactionId = gatewayTransactionId ?? order.GatewayTransactionId;
            order.ConfirmedBy = confirmedBy;
            order.AdminNote = adminNote;
            order.UpdatedAt = DateTime.UtcNow;
            order.UpdatedBy = confirmedBy ?? user.Email;

            await _paymentRepository.UpdateAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        private async Task<PaymentOrder> GetOwnedOrderAsync(int orderId, int userId, CancellationToken cancellationToken)
        {
            var order = await _paymentRepository.GetByIdAsync(orderId, cancellationToken)
                ?? throw new InvalidOperationException(BusinessMessages.PaymentOrderNotFound);

            if (order.UserId != userId)
                throw new UnauthorizedAccessException(BusinessMessages.PaymentOrderAccessDenied);

            return order;
        }

        private async Task ExpireIfNeededAsync(PaymentOrder order, CancellationToken cancellationToken)
        {
            if (order.Status != PaymentOrderStatus.Pending || order.ExpiresAt > DateTime.UtcNow)
                return;

            order.Status = PaymentOrderStatus.Expired;
            order.UpdatedAt = DateTime.UtcNow;
            await _paymentRepository.UpdateAsync(order, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        private async Task<PaymentOrderStatusDto> MapStatusAsync(PaymentOrder order, CancellationToken cancellationToken)
        {
            var plan = await _subscriptionRepository.GetByIdAsync(order.SubscriptionId, cancellationToken);
            var gatewayName = PaymentGatewayNames.ToName(order.Gateway);

            var checkoutUrl = order.Status == PaymentOrderStatus.Pending ? order.PaymentUrl : null;
            string? finalCheckoutUrl = null;
            string? finalQrCode = null;
            BankTransferInstructionsDto? bankTransfer = null;

            if (!string.IsNullOrEmpty(checkoutUrl))
            {
                var parts = checkoutUrl.Split('|');
                finalCheckoutUrl = parts[0];
                if (parts.Length > 1)
                {
                    finalQrCode = parts[1];
                }
                if (parts.Length > 5)
                {
                    var bin = parts[4];
                    var friendlyBankName = bin == "970422" ? "MB Bank" : $"Bank {bin}";
                    bankTransfer = new BankTransferInstructionsDto
                    {
                        AccountNumber = parts[2],
                        AccountHolder = parts[3],
                        BankName = friendlyBankName,
                        TransferContent = parts[5],
                        Amount = order.Amount,
                        QrImageUrl = finalQrCode
                    };
                }
            }

            return new PaymentOrderStatusDto
            {
                OrderId = order.Id,
                OrderCode = order.OrderCode,
                Gateway = gatewayName,
                Status = order.Status.ToString(),
                Amount = order.Amount,
                PlanId = order.SubscriptionId,
                PlanName = plan?.Name,
                ExpiresAt = order.ExpiresAt,
                PaidAt = order.PaidAt,
                FailureReason = order.FailureReason,
                CheckoutUrl = finalCheckoutUrl,
                QrCode = finalQrCode,
                BankTransfer = bankTransfer
            };
        }

        private async Task<AdminPaymentOrderDto> MapAdminOrderAsync(PaymentOrder order, CancellationToken cancellationToken)
        {
            var plan = await _subscriptionRepository.GetByIdAsync(order.SubscriptionId, cancellationToken);
            var user = await _authRepository.GetUserByIdAsync(order.UserId, cancellationToken);

            return new AdminPaymentOrderDto
            {
                OrderId = order.Id,
                OrderCode = order.OrderCode,
                Status = order.Status.ToString(),
                Amount = order.Amount,
                PlanId = order.SubscriptionId,
                PlanName = plan?.Name,
                UserId = order.UserId,
                UserEmail = user?.Email ?? "",
                UserFullName = user?.FullName ?? "",
                CreatedAt = order.CreatedAt,
                ExpiresAt = order.ExpiresAt,
                PaidAt = order.PaidAt,
                ConfirmedBy = order.ConfirmedBy,
                AdminNote = order.AdminNote
            };
        }

        private static PurchasePlanResponseDto MapPurchaseResponse(
            PaymentOrder order,
            string message,
            string? checkoutUrl = null,
            string? qrCode = null)
        {
            var dbPaymentUrl = order.PaymentUrl;
            var finalCheckoutUrl = checkoutUrl;
            var finalQrCode = qrCode;
            BankTransferInstructionsDto? bankTransfer = null;

            if (string.IsNullOrEmpty(finalCheckoutUrl) && !string.IsNullOrEmpty(dbPaymentUrl))
            {
                var parts = dbPaymentUrl.Split('|');
                finalCheckoutUrl = parts[0];
                if (parts.Length > 1)
                {
                    finalQrCode = parts[1];
                }
            }

            if (!string.IsNullOrEmpty(dbPaymentUrl))
            {
                var parts = dbPaymentUrl.Split('|');
                if (parts.Length > 5)
                {
                    var bin = parts[4];
                    var friendlyBankName = bin == "970422" ? "MB Bank" : $"Bank {bin}";
                    bankTransfer = new BankTransferInstructionsDto
                    {
                        AccountNumber = parts[2],
                        AccountHolder = parts[3],
                        BankName = friendlyBankName,
                        TransferContent = parts[5],
                        Amount = order.Amount,
                        QrImageUrl = finalQrCode
                    };
                }
            }

            return new PurchasePlanResponseDto
            {
                OrderId = order.Id,
                OrderCode = order.OrderCode,
                Gateway = PaymentGatewayNames.ToName(order.Gateway),
                Amount = order.Amount,
                ExpiresAt = order.ExpiresAt,
                Message = message,
                CheckoutUrl = finalCheckoutUrl,
                QrCode = finalQrCode,
                BankTransfer = bankTransfer
            };
        }

        public async Task<IReadOnlyList<AdminPaymentOrderDto>> GetAllOrdersAsync(CancellationToken cancellationToken = default)
        {
            var orders = await _paymentRepository.GetAllAsync(cancellationToken);
            var result = new List<AdminPaymentOrderDto>();
            foreach (var order in orders)
            {
                await ExpireIfNeededAsync(order, cancellationToken);
                result.Add(await MapAdminOrderAsync(order, cancellationToken));
            }
            return result;
        }

        /// <summary>Tạo mã orderCode cho PayOS (long, tối đa 9007199254740991)</summary>
        private static long GeneratePayOsOrderCode()
        {
            // Lấy Unix timestamp (giây) * 10000 + random 4 chữ số → đảm bảo unique
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var random = Random.Shared.Next(1000, 9999);
            return timestamp * 10000 + random;
        }
    }
}
