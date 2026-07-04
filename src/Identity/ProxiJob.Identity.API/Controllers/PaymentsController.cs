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
            // Trả về HTML đơn giản để tự động đóng/báo cho user
            var html = @"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1'>
                    <title>Trạng thái thanh toán</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; }
                        .success { color: #10B981; }
                        h1 { margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <h1 class='success'>Thanh toán hoàn tất!</h1>
                    <p>Vui lòng quay lại ứng dụng để kiểm tra.</p>
                    <script>
                        setTimeout(function() { window.close(); }, 3000);
                    </script>
                </body>
                </html>";
            return Content(html, "text/html");
        }

        [HttpGet("payos/cancel")]
        [AllowAnonymous]
        public IActionResult PayOsCancel([FromQuery] string orderCode)
        {
            var html = @"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1'>
                    <title>Thanh toán bị hủy</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; }
                        .error { color: #EF4444; }
                        h1 { margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <h1 class='error'>Thanh toán đã bị hủy</h1>
                    <p>Vui lòng quay lại ứng dụng và thử lại sau.</p>
                    <script>
                        setTimeout(function() { window.close(); }, 3000);
                    </script>
                </body>
                </html>";
            return Content(html, "text/html");
        }
    }
}
