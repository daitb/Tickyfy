using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Refund
{
    public class CreateRefundRequestDto
    {
        [Required]
        public Guid BookingId { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? AdditionalNotes { get; set; }
        
        public List<string>? Attachments { get; set; } // URLs to proof documents/images
        
        [Required]
        public decimal RefundAmount { get; set; }
        
        [Required]
        public string RefundMethod { get; set; } = "original"; // original, bank_transfer, wallet
    }
}