using Microsoft.Extensions.Configuration;
using ProxiJob.Identity.Application.Common.Interfaces;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace ProxiJob.Identity.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
        {
            var host = _configuration["SmtpSettings:Host"];
            var portStr = _configuration["SmtpSettings:Port"];
            var username = _configuration["SmtpSettings:Username"];
            var password = _configuration["SmtpSettings:Password"];
            var from = _configuration["SmtpSettings:From"];
            var fromName = _configuration["SmtpSettings:FromName"] ?? "ProxiJob";

            if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                throw new InvalidOperationException("Cấu hình gửi email (SMTP) chưa được thiết lập hoặc chưa đầy đủ trong appsettings.json. Vui lòng thiết lập SmtpSettings.");
            }

            int port = 587;
            if (!string.IsNullOrEmpty(portStr))
            {
                int.TryParse(portStr, out port);
            }

            var enableSsl = true;
            if (bool.TryParse(_configuration["SmtpSettings:EnableSsl"], out var sslVal))
            {
                enableSsl = sslVal;
            }

            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = enableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(from ?? username, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            // Send mail
            await client.SendMailAsync(mailMessage, cancellationToken);
        }
    }
}
