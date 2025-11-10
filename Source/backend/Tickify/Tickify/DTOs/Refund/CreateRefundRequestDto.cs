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
        
        public List<string>? EvidenceUrls { get; set; }
    }

}