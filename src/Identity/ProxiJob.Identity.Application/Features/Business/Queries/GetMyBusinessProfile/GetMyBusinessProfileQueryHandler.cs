using MediatR;
using ProxiJob.Identity.Application.Common.Exceptions;
using ProxiJob.Identity.Application.Common.Interfaces;
using ProxiJob.Identity.Application.Common.Messages;
using ProxiJob.Identity.Application.DTOs;
using ProxiJob.Identity.Application.Services;
using ProxiJob.Identity.Domain.Constants;

namespace ProxiJob.Identity.Application.Features.Business.Queries.GetMyBusinessProfile
{
    public class GetMyBusinessProfileQueryHandler : IRequestHandler<GetMyBusinessProfileQuery, BusinessProfileDto>
    {
        private readonly ICurrentUserService _currentUser;
        private readonly IBusinessProfileRepository _profileRepository;
        private readonly ISubscriptionRepository _subscriptionRepository;

        public GetMyBusinessProfileQueryHandler(
            ICurrentUserService currentUser,
            IBusinessProfileRepository profileRepository,
            ISubscriptionRepository subscriptionRepository)
        {
            _currentUser = currentUser;
            _profileRepository = profileRepository;
            _subscriptionRepository = subscriptionRepository;
        }

        public async Task<BusinessProfileDto> Handle(GetMyBusinessProfileQuery request, CancellationToken cancellationToken)
        {
            EnsureBusiness();

            var profile = await _profileRepository.GetByUserIdWithUserAsync(_currentUser.UserId!.Value, cancellationToken)
                ?? throw new InvalidOperationException(BusinessMessages.BusinessProfileNotFound);

            var (tier, _) = await _subscriptionRepository.GetUserTierInfoAsync(_currentUser.UserId!.Value, cancellationToken);

            return BusinessProfileMapper.ToDto(profile, tier);
        }

        private void EnsureBusiness()
        {
            if (_currentUser.UserId is null)
                throw new UnauthorizedAccessException(BusinessMessages.NotAuthenticated);
            if (_currentUser.Role != RoleNames.Business)
                throw new ForbiddenAccessException(BusinessMessages.BusinessProfileOnly);
        }
    }
}
