using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace ProxiJob.Identity.API.Hubs
{
    public class CustomUserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst("sub")?.Value 
                   ?? connection.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value 
                   ?? connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
