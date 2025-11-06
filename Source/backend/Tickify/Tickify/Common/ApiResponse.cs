namespace Tickify.Common;

<<<<<<< Updated upstream
/// <summary>
/// Class chuẩn để trả về kết quả từ API
/// Giúp frontend dễ dàng xử lý response theo format nhất quán
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu của data trả về</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Trạng thái thành công hay thất bại
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Thông báo cho người dùng
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Dữ liệu trả về (nếu thành công)
    /// </summary>
    public T? Data { get; set; }

    /// <summary>
    /// Danh sách lỗi chi tiết (nếu có)
    /// </summary>
    public List<string>? Errors { get; set; }

    /// <summary>
    /// Timestamp khi tạo response
    /// </summary>
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Tạo response thành công
    /// </summary>
=======
public class ApiResponse<T>
{
    public bool Success { get; set; }

    public string Message { get; set; } = string.Empty;


    public T? Data { get; set; }


    public List<string>? Errors { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;


>>>>>>> Stashed changes
    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Message = message,
            Data = data
        };
    }

<<<<<<< Updated upstream
    /// <summary>
    /// Tạo response thất bại
    /// </summary>
=======

>>>>>>> Stashed changes
    public static ApiResponse<T> FailureResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = errors
        };
    }
}
