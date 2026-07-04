using MediatR;
using ProxiJob.Job.Application.Common.Interfaces;
using ProxiJob.Job.Application.Common.Models;
using ProxiJob.Job.Application.Features.JobPosts.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ProxiJob.Job.Application.Features.JobPosts.Queries
{
    public class GetPublishedJobPostsQuery : IRequest<PagedResult<JobPostSummaryDto>>
    {
        public int? CategoryId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public class GetPublishedJobPostsQueryHandler : IRequestHandler<GetPublishedJobPostsQuery, PagedResult<JobPostSummaryDto>>
    {
        private readonly IJobDbContext _context;
        private readonly IIdentityGrpcClient _identityGrpcClient;

        public GetPublishedJobPostsQueryHandler(IJobDbContext context, IIdentityGrpcClient identityGrpcClient)
        {
            _context = context;
            _identityGrpcClient = identityGrpcClient;
        }

        public async Task<PagedResult<JobPostSummaryDto>> Handle(GetPublishedJobPostsQuery request, CancellationToken cancellationToken)
        {
            var query = _context.JobPosts
                .Include(j => j.Category)
                .Include(j => j.Location)
                .Include(j => j.Shifts)
                .Where(j => j.Status == "Published");

            if (request.CategoryId.HasValue)
            {
                query = query.Where(j => j.CategoryId == request.CategoryId.Value);
            }

            query = query.OrderByDescending(j => j.CreatedAt);

            var allPublishedJobs = await query.Select(j => new JobPostSummaryDto
                                    {
                                        Id = j.Id,
                                        BusinessId = j.BusinessId,
                                        Title = j.Title,
                                        Status = j.Status,
                                        CategoryName = j.Category != null ? j.Category.Name : null,
                                        Address = j.Location != null ? j.Location.Address : null,
                                        Latitude = j.Location != null ? j.Location.Latitude : 0,
                                        Longitude = j.Location != null ? j.Location.Longitude : 0,
                                        Description = j.Description,
                                        Requirements = j.Requirements,
                                        ShiftCount = j.Shifts.Count,
                                        CreatedAt = j.CreatedAt
                                    })
                                   .ToListAsync(cancellationToken);

            var filteredList = allPublishedJobs;

            if (request.Latitude.HasValue && request.Longitude.HasValue)
            {
                var uniqueBusinessIds = allPublishedJobs.Select(j => j.BusinessId).Distinct().ToList();
                var radiusDict = new Dictionary<int, int>();
                
                foreach (var bId in uniqueBusinessIds)
                {
                    try
                    {
                        var context = await _identityGrpcClient.GetUserByIdAsync(bId, cancellationToken);
                        radiusDict[bId] = context?.MaxSearchRadius ?? 3;
                    }
                    catch
                    {
                        radiusDict[bId] = 3; // default fallback
                    }
                }

                filteredList = allPublishedJobs.Where(j =>
                {
                    if (j.Latitude == 0 && j.Longitude == 0) return true; // skip if no location info
                    var maxRadius = radiusDict.TryGetValue(j.BusinessId, out var r) ? r : 3;
                    var distance = CalculateDistanceInKm(request.Latitude.Value, request.Longitude.Value, j.Latitude, j.Longitude);
                    return distance <= maxRadius;
                }).ToList();
            }

            var totalCount = filteredList.Count;
            var items = filteredList.Skip((request.PageNumber - 1) * request.PageSize)
                                   .Take(request.PageSize)
                                   .ToList();

            return new PagedResult<JobPostSummaryDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = request.PageNumber,
                PageSize = request.PageSize
            };
        }

        private static double CalculateDistanceInKm(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371; // Earth radius in km
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        private static double ToRadians(double val) => (Math.PI / 180) * val;
    }
}
