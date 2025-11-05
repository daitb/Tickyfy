namespace Tickify.Exceptions;

/// <summary>
/// Exception khi không có quyền truy cập (403 Forbidden)
/// VD: User thường cố gắng truy cập Admin API
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }

    public ForbiddenException()
        : base("Bạn không có quyền truy cập tài nguyên này.")
    {
    }
}
