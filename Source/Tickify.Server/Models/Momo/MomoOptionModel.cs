
namespace Tickify.Models.Momo
{
    public class MomoOptionModel
    {
        public string MomoApiUrl { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string AccessKey { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string NotifyUrl { get; set; } = string.Empty;
        public string PartnerCode { get; set; } = string.Empty;
        public string RequestType { get; set; } = "captureMoMoWallet";
        /// <summary>
        /// Thời gian hết hạn thanh toán (phút). Mặc định 15 phút.
        /// Nếu không thanh toán trong thời gian này, đơn hàng sẽ bị hủy.
        /// </summary>
        public int ExpireMinutes { get; set; } = 15;
    }
}
