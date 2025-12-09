namespace Tickify.Exceptions;


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
