namespace Tickify.Exceptions;


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
