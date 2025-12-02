namespace Tickify.Models.Momo
{
    public class MomoExecuteResponseModel
    {
        public string? OrderId    { get; set; }
        public long?   Amount     { get; set; }
        public string? OrderInfo  { get; set; }
        public string? Message    { get; set; }
        public int?    ResultCode { get; set; }
    }

}