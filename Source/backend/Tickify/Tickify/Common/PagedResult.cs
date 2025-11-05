namespace Tickify.Common;

/// <summary>
/// Class để trả về kết quả có phân trang (pagination)
/// Dùng cho các API list: GET /api/events, GET /api/users, etc.
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu của items trong list</typeparam>
public class PagedResult<T>
{
    /// <summary>
    /// Danh sách items trong trang hiện tại
    /// </summary>
    public List<T> Items { get; set; } = new();

    /// <summary>
    /// Số trang hiện tại (bắt đầu từ 1)
    /// </summary>
    public int PageNumber { get; set; }

    /// <summary>
    /// Số items trên mỗi trang
    /// </summary>
    public int PageSize { get; set; }

    /// <summary>
    /// Tổng số items trong database
    /// </summary>
    public int TotalCount { get; set; }

    /// <summary>
    /// Tổng số trang
    /// </summary>
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

    /// <summary>
    /// Có trang trước không?
    /// </summary>
    public bool HasPreviousPage => PageNumber > 1;

    /// <summary>
    /// Có trang sau không?
    /// </summary>
    public bool HasNextPage => PageNumber < TotalPages;

    /// <summary>
    /// Constructor
    /// </summary>
    public PagedResult(List<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }
}
