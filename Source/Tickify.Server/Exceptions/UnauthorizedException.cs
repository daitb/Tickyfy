namespace Tickify.Exceptions;


public class UnauthorizedException : Exception
{
    public UnauthorizedException(string message) : base(message)
    {
    }

    public UnauthorizedException()
        : base("Bạn cần đăng nhập để truy cập tài nguyên này.")
    {
    }
}
