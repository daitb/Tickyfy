using System.ComponentModel.DataAnnotations;

namespace Tickify.DTOs.Refund
{
    public class RejectRefundDto
    {
        [Required]
        [StringLength(500)]
        public string RejectionReason { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? AdminNotes { get; set; }
    }
}