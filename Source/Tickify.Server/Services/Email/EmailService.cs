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

        // Đọc cấu hình SMTP từ appsettings - Khớp với EmailSettings
        _smtpHost = _configuration["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
        _smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
        _smtpUser = _configuration["EmailSettings:Username"] ?? throw new ArgumentNullException("EmailSettings:Username");
        _smtpPassword = _configuration["EmailSettings:Password"] ?? throw new ArgumentNullException("EmailSettings:Password");
        _fromEmail = _configuration["EmailSettings:SenderEmail"] ?? _smtpUser;
        _fromName = _configuration["EmailSettings:SenderName"] ?? "Tickify Event Management";
    }

    /// <summary>
    /// Gửi email đơn giản
    /// Sử dụng: SMTP với SSL/TLS
    /// </summary>
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            // 1. Tạo mail message
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_fromEmail, _fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true // Hỗ trợ HTML
            };
            mailMessage.To.Add(to);

            // 2. Cấu hình SMTP client
            using var smtpClient = new SmtpClient(_smtpHost, _smtpPort)
            {
                Credentials = new NetworkCredential(_smtpUser, _smtpPassword),
                EnableSsl = true
            };

            // 3. Gửi email
            await smtpClient.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            // Log error (trong production nên log vào file/database)
            Console.WriteLine($"Error sending email: {ex.Message}");
            throw;
        }
    }

    /// <summary>
    /// Gửi email từ template HTML
    /// Đọc file template và replace {placeholders} bằng data
    /// </summary>
    public async Task SendEmailFromTemplateAsync(string to, string subject, string templateName, Dictionary<string, string> templateData)
    {
        // 1. Đọc template từ file
        var templatePath = Path.Combine(_env.ContentRootPath, "Templates", "Email", $"{templateName}.html");
        
        if (!File.Exists(templatePath))
            throw new FileNotFoundException($"Email template not found: {templateName}");

        var htmlBody = await File.ReadAllTextAsync(templatePath);

        // 2. Replace placeholders trong template
        foreach (var kvp in templateData)
        {
            htmlBody = htmlBody.Replace($"{{{kvp.Key}}}", kvp.Value);
        }

        // 3. Gửi email
        await SendEmailAsync(to, subject, htmlBody);
    }

    /// <summary>
    /// Gửi email xác thực tài khoản
    /// Template: VerifyEmail.html
    /// </summary>
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

    /// <summary>
    /// Gửi email reset password
    /// Template: PasswordReset.html
    /// </summary>
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

    /// <summary>
    /// Gửi email chào mừng user mới
    /// Template: Welcome.html
    /// </summary>
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
}
