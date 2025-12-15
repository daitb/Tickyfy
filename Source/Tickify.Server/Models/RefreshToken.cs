namespace Tickify.Models;

/// <summary>
/// Lưu trữ Refresh Tokens trong database
/// Dùng để làm mới Access Token khi hết hạn
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }
    
    public int UserId { get; set; }
    
    public string Token { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ExpiresAt { get; set; }
    
    public bool IsUsed { get; set; } = false;
    
    public bool IsRevoked { get; set; } = false;

    public User User { get; set; } = null!;
    
    public bool IsActive => !IsUsed && !IsRevoked && DateTime.UtcNow < ExpiresAt;
}
