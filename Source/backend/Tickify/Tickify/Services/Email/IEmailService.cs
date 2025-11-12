namespace Tickify.Services.Email;

/// <summary>
/// Interface cho Email Service
/// Xử lý: Send email, Load template
/// </summary>
public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body);

    Task SendEmailFromTemplateAsync(string to, string subject, string templateName, Dictionary<string, string> templateData);

    Task SendVerificationEmailAsync(string to, string userName, string verificationUrl);

    Task SendPasswordResetEmailAsync(string to, string userName, string resetUrl);

    Task SendWelcomeEmailAsync(string to, string userName);
}
