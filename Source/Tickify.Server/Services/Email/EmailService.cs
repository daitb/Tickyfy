using System.Net;
using System.Net.Mail;

namespace Tickify.Services.Email;

/// <summary>
/// Service xử lý gửi email
/// Chức năng: Send email qua SMTP, Load template HTML, Replace placeholders
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _smtpUser;
    private readonly string _smtpPassword;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, IWebHostEnvironment env)
    {
        _configuration = configuration;
        _env = env;

        _smtpHost = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
        _smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
        _smtpUser = _configuration["EmailSettings:Username"] ?? throw new ArgumentNullException("EmailSettings:Username");
        _smtpPassword = _configuration["EmailSettings:Password"] ?? throw new ArgumentNullException("EmailSettings:Password");
        _fromEmail = _configuration["EmailSettings:SenderEmail"] ?? _smtpUser;
        _fromName = _configuration["EmailSettings:SenderName"] ?? "Tickify Event Management";
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true // Hỗ trợ HTML
            };
            mailMessage.To.Add(to);

            using var smtpClient = new SmtpClient(_smtpHost, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUser, _smtpPassword),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending email: {ex.Message}");
            throw;
        }
    }

    public async Task SendEmailFromTemplateAsync(string to, string subject, string templateName, Dictionary<string, string> templateData)
    {
        var templatePath = Path.Combine(_env.ContentRootPath, "Templates", "Email", $"{templateName}.html");
        
        if (!File.Exists(templatePath))
            throw new FileNotFoundException($"Email template not found: {templateName}");

        var htmlBody = await File.ReadAllTextAsync(templatePath);

        foreach (var kvp in templateData)
        {
            htmlBody = htmlBody.Replace($"{{{kvp.Key}}}", kvp.Value);
        }

        await SendEmailAsync(to, subject, htmlBody);
    }

    public async Task SendVerificationEmailAsync(string to, string userName, string verificationUrl)
    {
        var templateData = new Dictionary<string, string>
        {
            { "UserName", userName },
            { "VerificationUrl", verificationUrl }
        };

        await SendEmailFromTemplateAsync(
            to,
            "Xác thực tài khoản Tickify",
            "VerifyEmail",
            templateData
        );
    }

    public async Task SendPasswordResetEmailAsync(string to, string userName, string resetUrl)
    {
        var templateData = new Dictionary<string, string>
        {
            { "UserName", userName },
            { "ResetUrl", resetUrl }
        };

        await SendEmailFromTemplateAsync(
            to,
            "Đặt lại mật khẩu Tickify",
            "PasswordReset",
            templateData
        );
    }

    public async Task SendWelcomeEmailAsync(string to, string userName)
    {
        var templateData = new Dictionary<string, string>
        {
            { "UserName", userName }
        };

        await SendEmailFromTemplateAsync(
            to,
            "Chào mừng đến với Tickify!",
            "Welcome",
            templateData
        );
    }

    #region Organizer Emails

    /// <summary>
    /// Gửi email chào mừng organizer mới
    /// Template: OrganizerWelcome.html
    /// </summary>
    public async Task SendOrganizerWelcomeEmailAsync(string to, string userName, string companyName)
    {
        var templateData = new Dictionary<string, string>
        {
            { "UserName", userName },
            { "CompanyName", companyName }
        };

        await SendEmailFromTemplateAsync(
            to,
            "Chào mừng đến với Tickify - Organizer Platform",
            "OrganizerWelcome",
            templateData
        );
    }

    /// <summary>
    /// Gửi email xác nhận organizer đã được verify
    /// Template: OrganizerVerification.html
    /// </summary>
    public async Task SendOrganizerVerificationEmailAsync(string to, string userName, string companyName)
    {
        var templateData = new Dictionary<string, string>
        {
            { "UserName", userName },
            { "CompanyName", companyName }
        };

        await SendEmailFromTemplateAsync(
            to,
            "Tài khoản Organizer đã được xác thực",
            "OrganizerVerification",
            templateData
        );
    }

    #endregion

    #region Support Ticket Emails

    /// Send confirmation email when support ticket is created
    public async Task SendSupportTicketConfirmationEmailAsync(string to, string userName, string ticketNumber, string subject)
    {
        var htmlBody = $@"
            <h2>Support Ticket Created - #{ticketNumber}</h2>
            <p>Hi {userName},</p>
            <p>We've received your support request:</p>
            <p><strong>Ticket #:</strong> {ticketNumber}<br>
            <strong>Subject:</strong> {subject}</p>
            <p>Our support team will review your request and get back to you as soon as possible.</p>
            <p>You can track your ticket status in your account dashboard.</p>
            <p>Thank you,<br>Tickify Support Team</p>
        ";

        await SendEmailAsync(to, $"Support Ticket #{ticketNumber} Created", htmlBody);
    }

    /// Send email when support ticket is updated with a new message
    public async Task SendSupportTicketUpdateEmailAsync(string to, string userName, string ticketNumber, string subject, string message, bool isStaffResponse)
    {
        var messageType = isStaffResponse ? "Our support team has replied" : "Your message has been received";
        
        var htmlBody = $@"
            <h2>Support Ticket Update - #{ticketNumber}</h2>
            <p>Hi {userName},</p>
            <p>{messageType} to your support ticket:</p>
            <p><strong>Ticket #:</strong> {ticketNumber}<br>
            <strong>Subject:</strong> {subject}</p>
            <hr>
            <p>{message}</p>
            <hr>
            <p>You can view the full conversation in your account dashboard.</p>
            <p>Thank you,<br>Tickify Support Team</p>
        ";

        await SendEmailAsync(to, $"Support Ticket #{ticketNumber} Updated", htmlBody);
    }

    /// Send email when support ticket is resolved
    public async Task SendSupportTicketResolvedEmailAsync(string to, string userName, string ticketNumber, string subject)
    {
        var htmlBody = $@"
            <h2>Support Ticket Resolved - #{ticketNumber}</h2>
            <p>Hi {userName},</p>
            <p>Your support ticket has been marked as resolved:</p>
            <p><strong>Ticket #:</strong> {ticketNumber}<br>
            <strong>Subject:</strong> {subject}</p>
            <p>If you have any additional questions or concerns, please feel free to create a new support ticket.</p>
            <p>Thank you for using Tickify!</p>
            <p>Best regards,<br>Tickify Support Team</p>
        ";

        await SendEmailAsync(to, $"Support Ticket #{ticketNumber} Resolved", htmlBody);
    }

    #endregion
}
