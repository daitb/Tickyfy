using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Payout
{
    public class RequestPayoutDto
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
        
        [Required]
        public string PayoutMethod { get; set; } = "bank_transfer";
        
        // Bank transfer details
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountHolderName { get; set; }
        public string? Branch { get; set; }
        
        // E-wallet details
        public string? WalletType { get; set; } // momo, zalo pay, etc.
        public string? WalletNumber { get; set; }
        
        public List<Guid>? EventIds { get; set; } // Specific events to payout (optional)
    }
}