namespace Tickify.Services.Email;

/// <summary>
/// Interface cho Email Service
/// Xử lý: Send email, Load template
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Gửi email đơn giản
    /// </summary>
    /// <param name="to">Email người nhận</param>
    /// <param name="subject">Tiêu đề email</param>
    /// <param name="body">Nội dung email (HTML hoặc plain text)</param>
    Task SendEmailAsync(string to, string subject, string body);

    /// <summary>
    /// Gửi email từ template
    /// </summary>
    /// <param name="to">Email người nhận</param>
    /// <param name="subject">Tiêu đề email</param>
    /// <param name="templateName">Tên template (không có extension)</param>
    /// <param name="templateData">Data để replace trong template</param>
    Task SendEmailFromTemplateAsync(string to, string subject, string templateName, Dictionary<string, string> templateData);

    /// <summary>
    /// Gửi email xác thực tài khoản
    /// </summary>
    /// <param name="to">Email người nhận</param>
    /// <param name="userName">Tên người dùng</param>
    /// <param name="verificationUrl">URL xác thực</param>
    Task SendVerificationEmailAsync(string to, string userName, string verificationUrl);

    /// <summary>
    /// Gửi email reset password
    /// </summary>
    /// <param name="to">Email người nhận</param>
    /// <param name="userName">Tên người dùng</param>
    /// <param name="resetUrl">URL reset password</param>
    Task SendPasswordResetEmailAsync(string to, string userName, string resetUrl);

    /// <summary>
    /// Gửi email chào mừng
    /// </summary>
    /// <param name="to">Email người nhận</param>
    /// <param name="userName">Tên người dùng</param>
    Task SendWelcomeEmailAsync(string to, string userName);
}
