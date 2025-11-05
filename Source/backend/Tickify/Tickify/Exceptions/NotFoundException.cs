namespace Tickify.Exceptions;

/// <summary>
/// Exception khi không tìm thấy resource (404 Not Found)
/// VD: Không tìm thấy Event với ID = 123
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message)
    {
    }

    public NotFoundException(string entityName, object key)
        : base($"{entityName} với ID '{key}' không tìm thấy.")
    {
    }
}
