namespace ProxiJob.Identity.Application.DTOs
{
    public class PayOsCreatePaymentResult
    {
        /// <summary>Link thanh toán PayOS (redirect user tới đây)</summary>
        public string CheckoutUrl { get; set; } = string.Empty;
        /// <summary>QR code URL từ PayOS</summary>
        public string QrCode { get; set; } = string.Empty;
        /// <summary>Mã đơn hàng PayOS (long)</summary>
        public long PayOsOrderCode { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountName { get; set; }
        public string? Bin { get; set; }
    }
}
