using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Refund
{
    public class ApproveRefundDto
    {
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal ApprovedAmount { get; set; }
        
        [StringLength(1000)]
        public string? AdminNotes { get; set; }
        
        [Required]
        public string RefundMethod { get; set; } = "original";
        
        // For bank transfer refunds
        public string? BankAccountNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountHolderName { get; set; }
    }
}