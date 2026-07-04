using MassTransit;
using Microsoft.AspNetCore.SignalR;
using ProxiJob.Identity.API.Hubs;
using ProxiJob.Shared.Contract.Events;
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProxiJob.Identity.Infrastructure.Data;

namespace ProxiJob.Identity.API.Messaging.Consumers
{
    public class NotificationConsumer : 
        IConsumer<ApplicationApprovedEvent>,
        IConsumer<ApplicationRejectedEvent>,
        IConsumer<PayrollPaidEvent>,
        IConsumer<JobPublishedEvent>,
        IConsumer<ShiftAppliedEvent>
    {
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IdentityDbContext _dbContext;

        public NotificationConsumer(IHubContext<ChatHub> hubContext, IdentityDbContext dbContext)
        {
            _hubContext = hubContext;
            _dbContext = dbContext;
        }

        public async Task Consume(ConsumeContext<ApplicationApprovedEvent> context)
        {
            var msg = context.Message;
            string title = "Ứng tuyển";
            string content = $"Chúc mừng! Đơn ứng tuyển ca làm \"{msg.JobTitle}\" của bạn đã được DUYỆT.";
            string time = "Vừa xong";

            await _hubContext.Clients.User(msg.StudentId.ToString())
                .SendAsync("ReceiveNotification", title, content, time);
        }

        public async Task Consume(ConsumeContext<ApplicationRejectedEvent> context)
        {
            var msg = context.Message;
            string title = "Ứng tuyển";
            string content = $"Rất tiếc, đơn ứng tuyển ca làm \"{msg.JobTitle}\" của bạn đã bị từ chối.";
            if (!string.IsNullOrEmpty(msg.Note))
            {
                content += $" Lý do: {msg.Note}";
            }
            string time = "Vừa xong";

            await _hubContext.Clients.User(msg.StudentId.ToString())
                .SendAsync("ReceiveNotification", title, content, time);
        }

        public async Task Consume(ConsumeContext<PayrollPaidEvent> context)
        {
            var msg = context.Message;
            string title = "Quyết toán lương";
            string content = $"Bạn đã nhận được {msg.FinalAmount:N0} đ thanh toán lương ca làm từ hệ thống.";
            string time = "Vừa xong";

            await _hubContext.Clients.User(msg.StudentId.ToString())
                .SendAsync("ReceiveNotification", title, content, time);
        }

        public async Task Consume(ConsumeContext<JobPublishedEvent> context)
        {
            var msg = context.Message;
            string title = "TIN TUYỂN DỤNG";
            string content = $"Bài đăng \"{msg.Title}\" đã được đẩy lên hệ thống!";
            string time = "Vừa xong";

            await _hubContext.Clients.All
                .SendAsync("ReceiveNotification", title, content, time);
        }

        public async Task Consume(ConsumeContext<ShiftAppliedEvent> context)
        {
            var msg = context.Message;
            try
            {
                var businessProfile = await _dbContext.BusinessProfiles
                    .FirstOrDefaultAsync(p => p.Id == msg.BusinessId);

                if (businessProfile != null)
                {
                    string title = "Ứng tuyển mới";
                    string content = $"Có ứng viên mới ứng tuyển vào ca làm \"{msg.JobTitle}\".";
                    string time = "Vừa xong";

                    await _hubContext.Clients.User(businessProfile.UserId.ToString())
                        .SendAsync("ReceiveNotification", title, content, time);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[NotificationConsumer] Error processing ShiftAppliedEvent: {ex.Message}");
            }
        }
    }
}
