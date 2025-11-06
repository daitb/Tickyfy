namespace Tickify.Exceptions;

<<<<<<< Updated upstream
/// <summary>
/// Exception khi validation thất bại (400 Bad Request)
/// VD: Email không đúng format, password quá ngắn
/// </summary>
=======

>>>>>>> Stashed changes
public class BadRequestException : Exception
{
    public List<string> Errors { get; set; }

    public BadRequestException(string message) : base(message)
    {
        Errors = new List<string> { message };
    }

    public BadRequestException(List<string> errors) : base("Validation failed")
    {
        Errors = errors;
    }
}
