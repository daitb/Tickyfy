namespace Tickify.Exceptions;

<<<<<<< Updated upstream
/// <summary>
/// Exception khi chưa đăng nhập (401 Unauthorized)
/// VD: Gọi API cần authentication mà không có token
/// </summary>
=======

>>>>>>> Stashed changes
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
