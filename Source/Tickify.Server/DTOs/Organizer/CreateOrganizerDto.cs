namespace Tickify.DTOs.Organizer;

public class CreateOrganizerDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string? BusinessRegistrationNumber { get; set; }
    public string? TaxCode { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
    public string? CompanyEmail { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
}
