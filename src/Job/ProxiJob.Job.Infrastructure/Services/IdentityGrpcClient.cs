using Grpc.Net.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProxiJob.Job.Application.Common.Interfaces;
using ProxiJob.Shared.Contract.Identity;
using ProxiJob.Shared.Contract.Protos;

namespace ProxiJob.Job.Infrastructure.Services;

public class IdentityGrpcClient : IIdentityGrpcClient, IDisposable
{
    private readonly GrpcChannel _channel;
    private readonly IdentityGrpcService.IdentityGrpcServiceClient _client;
    private readonly ILogger<IdentityGrpcClient> _logger;

    public IdentityGrpcClient(IConfiguration configuration, ILogger<IdentityGrpcClient> logger)
    {
        _logger = logger;
        var address = configuration["GrpcServices:Identity"]
            ?? configuration["IdentityGrpc:Address"]
            ?? "http://localhost:5232";

        _channel = GrpcChannel.ForAddress(address);
        _client = new IdentityGrpcService.IdentityGrpcServiceClient(_channel);
    }

    public async Task<IdentityUserContextSnapshot?> GetUserFromAccessTokenAsync(
        string? accessToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            return null;

        try
        {
            var response = await _client.ValidateAccessTokenAsync(
                new ValidateAccessTokenRequest { AccessToken = accessToken.Trim() },
                cancellationToken: cancellationToken);

            if (!response.Found || response.User == null)
                return null;

            return IdentityUserContextMapper.FromGrpc(response.User);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ValidateAccessToken gRPC failed");
            return null;
        }
    }

    public async Task<IdentityUserContextSnapshot?> GetUserByIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            return null;

        try
        {
            var response = await _client.GetUserContextAsync(
                new GetUserContextRequest { UserId = userId },
                cancellationToken: cancellationToken);

            if (!response.Found || response.User == null)
                return null;

            return IdentityUserContextMapper.FromGrpc(response.User);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetUserContext gRPC failed for user {UserId}", userId);
            return null;
        }
    }

    public async Task<string?> GetStudentCVUrlAsync(int studentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.GetStudentCvForApplicationAsync(
                new GetStudentCvForApplicationRequest { StudentId = studentId },
                cancellationToken: cancellationToken);

            if (!response.Found || string.IsNullOrWhiteSpace(response.CvUrl))
                return null;

            return response.CvUrl;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetStudentCvForApplication gRPC failed for student {StudentId}", studentId);
            return null;
        }
    }

    public async Task<StudentProfileGrpcDto?> GetStudentProfileAsync(int studentId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _client.GetStudentCvForApplicationAsync(
                new GetStudentCvForApplicationRequest { StudentId = studentId },
                cancellationToken: cancellationToken);

            if (!response.Found || response.Profile == null)
                return null;

            return response.Profile;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "GetStudentCvForApplication gRPC failed for student {StudentId} when fetching profile", studentId);
            return null;
        }
    }

    public async Task<CheckJobPostQuotaResponse> CheckJobPostQuotaAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _client.CheckJobPostQuotaAsync(
                new CheckJobPostQuotaRequest { UserId = userId },
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CheckJobPostQuota gRPC failed for user {UserId}", userId);
            // Return a restrictive default — fail closed
            return new CheckJobPostQuotaResponse
            {
                CanPostJob = false,
                Message = "Không thể kiểm tra hạn mức đăng tin. Vui lòng thử lại."
            };
        }
    }

    public async Task<ConsumeJobPostQuotaResponse> ConsumeJobPostQuotaAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _client.ConsumeJobPostQuotaAsync(
                new ConsumeJobPostQuotaRequest { UserId = userId },
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ConsumeJobPostQuota gRPC failed for user {UserId}", userId);
            return new ConsumeJobPostQuotaResponse
            {
                Success = false,
                Message = "Không thể trừ lượt đăng tin. Vui lòng thử lại."
            };
        }
    }

    public async Task<CheckStudentApplyQuotaResponse> CheckStudentApplyQuotaAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _client.CheckStudentApplyQuotaAsync(
                new CheckStudentApplyQuotaRequest { UserId = userId },
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "CheckStudentApplyQuota gRPC failed for student {UserId}", userId);
            return new CheckStudentApplyQuotaResponse
            {
                CanApply = false,
                Message = "Không thể kiểm tra hạn mức ứng tuyển. Vui lòng thử lại."
            };
        }
    }

    public async Task<ConsumeStudentApplyQuotaResponse> ConsumeStudentApplyQuotaAsync(int userId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _client.ConsumeStudentApplyQuotaAsync(
                new ConsumeStudentApplyQuotaRequest { UserId = userId },
                cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "ConsumeStudentApplyQuota gRPC failed for student {UserId}", userId);
            return new ConsumeStudentApplyQuotaResponse
            {
                Success = false,
                Message = "Không thể trừ lượt ứng tuyển. Vui lòng thử lại."
            };
        }
    }

    public void Dispose() => _channel.Dispose();
}
