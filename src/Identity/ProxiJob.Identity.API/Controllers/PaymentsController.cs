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
        public IActionResult PayOsReturn([FromQuery] string orderCode, [FromQuery] string? role)
        {
            var targetPath = role == "Business" ? "/employer" : "/student";
            var targetUrl = $"https://app.proxijob.io.vn{targetPath}?status=paid&orderCode={orderCode}";

            var html = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Đang chuyển hướng...</title>
                </head>
                <body>
                    <script>
                        try {{
                            if (window.top) {{
                                window.top.location.href = '{targetUrl}';
                            }} else {{
                                window.location.href = '{targetUrl}';
                            }}
                        }} catch(e) {{
                            window.location.href = '{targetUrl}';
                        }}
                    </script>
                </body>
                </html>";
            return Content(html, "text/html");
        }

        [HttpGet("payos/cancel")]
        [AllowAnonymous]
        public IActionResult PayOsCancel([FromQuery] string orderCode, [FromQuery] string? role)
        {
            var targetPath = role == "Business" ? "/employer" : "/student";
            var targetUrl = $"https://app.proxijob.io.vn{targetPath}?status=cancelled&orderCode={orderCode}";

            var html = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Đang chuyển hướng...</title>
                </head>
                <body>
                    <script>
                        try {{
                            if (window.top) {{
                                window.top.location.href = '{targetUrl}';
                            }} else {{
                                window.location.href = '{targetUrl}';
                            }}
                        }} catch(e) {{
                            window.location.href = '{targetUrl}';
                        }}
                    </script>
                </body>
                </html>";
            return Content(html, "text/html");
        }
    }
}
