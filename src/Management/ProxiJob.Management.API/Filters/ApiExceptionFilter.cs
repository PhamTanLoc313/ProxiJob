using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using ProxiJob.Management.API.Common;
using System;

namespace ProxiJob.Management.API.Filters
{
    public class ApiExceptionFilter : IExceptionFilter
    {
        public void OnException(ExceptionContext context)
        {
            var exception = context.Exception;
            int statusCode = StatusCodes.Status500InternalServerError;
            string message = "Đã xảy ra lỗi hệ thống.";

            if (exception is UnauthorizedAccessException)
            {
                statusCode = StatusCodes.Status403Forbidden;
                message = exception.Message;
            }
            else if (exception is ArgumentException || exception is InvalidOperationException)
            {
                statusCode = StatusCodes.Status400BadRequest;
                message = exception.Message;
            }

            var response = ApiResponse.FailureResponse(message);
            context.Result = new ObjectResult(response)
            {
                StatusCode = statusCode
            };
            context.ExceptionHandled = true;
        }
    }
}
