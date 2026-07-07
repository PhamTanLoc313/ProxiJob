using MediatR;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.DTOs;
using ProxiJob.Identity.Domain.Constants;
using ProxiJob.Identity.Domain.Models;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace ProxiJob.Identity.Application.Features.Auth.Commands.GoogleLogin
{
    public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, AuthTokensDto>
    {
        private readonly IAuthRepository _authRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IAuthSessionService _authSessionService;
        private readonly IUnitOfWork _unitOfWork;

        public GoogleLoginCommandHandler(
            IAuthRepository authRepository,
            IRoleRepository roleRepository,
            IAuthSessionService authSessionService,
            IUnitOfWork unitOfWork)
        {
            _authRepository = authRepository;
            _roleRepository = roleRepository;
            _authSessionService = authSessionService;
            _unitOfWork = unitOfWork;
        }

        public async Task<AuthTokensDto> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
        {
            string email;
            string name;
            string? picture = null;

            // Dev bypass check for mock tokens
            if (request.IdToken.StartsWith("mock-google-id-token") || request.IdToken == "mock-google-access-token-123456")
            {
                var parts = request.IdToken.Split('|');
                if (parts.Length >= 3)
                {
                    email = parts[1];
                    name = parts[2];
                }
                else
                {
                    email = request.Role.ToLower() == "employer" || request.Role.ToLower() == "business" 
                        ? "employer.google@gmail.com" 
                        : "student.google@gmail.com";
                    name = request.Role.ToLower() == "employer" || request.Role.ToLower() == "business" 
                        ? "Google Employer (Mocked)" 
                        : "Google Student (Mocked)";
                }
                picture = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
            }
            else
            {
                // Verify real Google token
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={request.IdToken}", cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    throw new UnauthorizedAccessException("Xác thực Token Google không thành công.");
                }

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                using var jsonDoc = JsonDocument.Parse(content);
                var root = jsonDoc.RootElement;

                if (!root.TryGetProperty("email", out var emailProp))
                {
                    throw new UnauthorizedAccessException("Token Google không chứa thông tin email.");
                }

                email = emailProp.GetString()!;
                name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString()! : email.Split('@')[0];
                picture = root.TryGetProperty("picture", out var pictureProp) ? pictureProp.GetString() : null;
            }

            // Find user by email
            var user = await _authRepository.GetUserByEmailAsync(email, cancellationToken);
            if (user == null)
            {
                // Determine target role name
                var roleName = request.Role.ToLower() switch
                {
                    "student" => RoleNames.Student,
                    "employer" => RoleNames.Business,
                    "business" => RoleNames.Business,
                    _ => RoleNames.Student
                };

                // Create new user (automatically verified)
                user = new User
                {
                    FullName = name,
                    Email = email,
                    Username = email,
                    PasswordHash = "", // OAuth login
                    AvatarUrl = picture,
                    IsActive = true,
                    CreatedBy = "GoogleAuth"
                };

                await _authRepository.AddUserAsync(user, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                // Assign role
                await _roleRepository.AssignRoleToUserAsync(user.Id, roleName, "GoogleAuth", cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
            else
            {
                // Update avatar if provided
                if (!string.IsNullOrEmpty(picture) && user.AvatarUrl != picture)
                {
                    user.AvatarUrl = picture;
                    await _authRepository.UpdateUserAsync(user, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException(BusinessMessages.AccountInactive);
            }

            // Issue session
            return await _authSessionService.IssueSessionAsync(user, cancellationToken);
        }
    }
}
