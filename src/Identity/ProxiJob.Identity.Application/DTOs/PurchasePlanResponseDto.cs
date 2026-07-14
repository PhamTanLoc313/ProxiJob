namespace ProxiJob.Identity.Application.DTOs
{
    public class PurchasePlanResponseDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; }
        public string Gateway { get; set; } = "PayOS";
        public decimal Amount { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Message { get; set; }
        public BankTransferInstructionsDto? BankTransfer { get; set; }
        /// <summary>Link thanh toán PayOS — FE mở link này trong browser/WebView</summary>
        public string? CheckoutUrl { get; set; }
        /// <summary>QR code URL từ PayOS (chứa đầy đủ thông tin + số tiền)</summary>
        public string? QrCode { get; set; }
    }
}
