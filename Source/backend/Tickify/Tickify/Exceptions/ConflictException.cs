namespace Tickify.Exceptions;

/// <summary>
/// Exception khi có conflict về business logic (409 Conflict)
/// VD: Email đã tồn tại, ghế đã được đặt, sự kiện đã hết vé
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
