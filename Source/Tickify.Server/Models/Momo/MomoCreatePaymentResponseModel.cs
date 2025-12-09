using System.Text.Json.Serialization;

namespace Tickify.Models.Momo;
public class MomoCreatePaymentResponseModel
{
    [JsonPropertyName("requestId")]   public string? RequestId { get; set; }
    [JsonPropertyName("orderId")]     public string? OrderId { get; set; }
    [JsonPropertyName("payUrl")]      public string? PayUrl { get; set; }
    [JsonPropertyName("errorCode")]   public int? ErrorCode { get; set; }     // một số bản trả errorCode
    [JsonPropertyName("resultCode")]  public int? ResultCode { get; set; }    // bản khác trả resultCode
    [JsonPropertyName("message")]     public string? Message { get; set; }
    [JsonPropertyName("localMessage")]public string? LocalMessage { get; set; }
    [JsonPropertyName("signature")]   public string? Signature { get; set; }
}
