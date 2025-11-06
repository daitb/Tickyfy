namespace Tickify.Exceptions;


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
