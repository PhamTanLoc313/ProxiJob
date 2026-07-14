using ProxiJob.Identity.Domain.Enums;

namespace ProxiJob.Identity.Domain.Constants
{
    public static class PaymentGatewayNames
    {
        public const string BankTransfer = "BankTransfer";
        public const string PayOS = "PayOS";

        public static readonly string[] All = { BankTransfer, PayOS };

        public static bool TryParse(string? value, out PaymentGatewayType gateway)
        {
            gateway = PaymentGatewayType.BankTransfer;
            if (string.IsNullOrWhiteSpace(value))
                return true;

            var v = value.Trim().ToUpperInvariant();

            if (v is "BANKTRANSFER" or "BANK_TRANSFER" or "TRANSFER" or "CK")
                return true;

            if (v is "PAYOS" or "PAY_OS")
            {
                gateway = PaymentGatewayType.PayOS;
                return true;
            }

            return false;
        }

        public static string ToName(PaymentGatewayType gateway) => gateway switch
        {
            PaymentGatewayType.PayOS => PayOS,
            _ => BankTransfer
        };
    }
}
