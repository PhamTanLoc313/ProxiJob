using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Shared.Contract;

namespace ProxiJob.Identity.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly ICurrentUserService _currentUser;

        public PaymentsController(IPaymentService paymentService, ICurrentUserService currentUser)
        {
            _paymentService = paymentService;
            _currentUser = currentUser;
        }

        [HttpGet("{orderId:int}")]
        [Authorize]
        public async Task<IActionResult> GetStatus(int orderId, CancellationToken cancellationToken)
        {
            if (_currentUser.UserId is not int userId)
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, BusinessMessages.NotAuthenticated));

            try
            {
                var status = await _paymentService.GetOrderStatusAsync(orderId, userId, cancellationToken);
                return Ok(ApiResponse<object>.Success(status, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, ex.Message));
            }
        }

        [HttpPost("{orderId:int}/session")]
        [Authorize]
        public async Task<IActionResult> CreateSession(int orderId, CancellationToken cancellationToken)
        {
            if (_currentUser.UserId is not int userId)
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, BusinessMessages.NotAuthenticated));

            try
            {
                var tokens = await _paymentService.IssueTokensIfPaidAsync(orderId, userId, cancellationToken);
                if (tokens == null)
                    return BadRequest(ApiResponse.Fail(StatusCodes.Status400BadRequest, BusinessMessages.PaymentNotCompleted));

                return Ok(ApiResponse<object>.Success(tokens, StatusCodes.Status200OK));
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ApiResponse.Fail(StatusCodes.Status401Unauthorized, ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ApiResponse.Fail(StatusCodes.Status404NotFound, ex.Message));
            }
        }

        [HttpPost("payos/webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> PayOsWebhook(
            [FromBody] object webhookBody,
            CancellationToken cancellationToken)
        {
            try
            {
                // PayOS gửi webhook payload dạng JSON, parse về string để SDK verify
                var webhookBodyString = System.Text.Json.JsonSerializer.Serialize(webhookBody);
                await _paymentService.HandlePayOsWebhookAsync(webhookBodyString, cancellationToken);
                
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                // Log exception if needed
                return Ok(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("payos/return")]
        [AllowAnonymous]
        public IActionResult PayOsReturn([FromQuery] string orderCode)
        {
            var html = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1'>
                    <title>Thanh toán thành công</title>
                    <style>
                        body {{ font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #F8FAFC; margin: 0; }}
                        .card {{ background: white; padding: 32px 24px; border-radius: 24px; box-shadow: 0 10px 30px rgba(16,185,129,0.1); max-width: 360px; margin: 0 auto; border: 1px solid #E2E8F0; }}
                        .icon {{ width: 64px; height: 64px; background: linear-gradient(135deg, #10B981, #059669); color: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; box-shadow: 0 8px 20px rgba(16,185,129,0.3); }}
                        .title {{ color: #0F172A; font-size: 20px; font-weight: 900; margin-bottom: 8px; tracking-tight: -0.02em; }}
                        .desc {{ color: #64748B; font-size: 13px; font-weight: 500; line-height: 1.5; margin: 0; }}
                    </style>
                </head>
                <body>
                    <div class='card'>
                        <div class='icon'>✓</div>
                        <div class='title'>Thanh Toán Thành Công!</div>
                        <div class='desc'>Hệ thống đang tự động kích hoạt tài khoản của bạn...</div>
                    </div>
                    <script>
                        try {{
                            if (window.parent && window.parent !== window) {{
                                window.parent.postMessage({{ type: 'PAYOS_SUCCESS', orderCode: '{orderCode}' }}, '*');
                            }}
                        }} catch(e) {{}}
                    </script>
                </body>
                </html>";
            return Content(html, "text/html");
        }

        [HttpGet("payos/cancel")]
        [AllowAnonymous]
        public IActionResult PayOsCancel([FromQuery] string orderCode)
        {
            var html = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1'>
                    <title>Thanh toán bị hủy</title>
                    <style>
                        body {{ font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #F8FAFC; margin: 0; }}
                        .card {{ background: white; padding: 32px 24px; border-radius: 24px; box-shadow: 0 10px 30px rgba(239,68,68,0.1); max-width: 360px; margin: 0 auto; border: 1px solid #E2E8F0; }}
                        .icon {{ width: 64px; height: 64px; background: linear-gradient(135deg, #EF4444, #DC2626); color: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; box-shadow: 0 8px 20px rgba(239,68,68,0.3); }}
                        .title {{ color: #0F172A; font-size: 20px; font-weight: 900; margin-bottom: 8px; }}
                        .desc {{ color: #64748B; font-size: 13px; font-weight: 500; line-height: 1.5; margin: 0; }}
                    </style>
                </head>
                <body>
                    <div class='card'>
                        <div class='icon'>✕</div>
                        <div class='title'>Thanh Toán Đã Hủy</div>
                        <div class='desc'>Giao dịch chưa hoàn tất. Vui lòng thử lại.</div>
                    </div>
                    <script>
                        try {{
                            if (window.parent && window.parent !== window) {{
                                window.parent.postMessage({{ type: 'PAYOS_CANCEL', orderCode: '{orderCode}' }}, '*');
                            }}
                        }} catch(e) {{}}
                    </script>
                </body>
                </html>";
            return Content(html, "text/html");
        }
    }
}
