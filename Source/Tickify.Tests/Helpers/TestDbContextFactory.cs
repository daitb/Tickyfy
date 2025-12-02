using Microsoft.EntityFrameworkCore;
using Tickify.Data;

namespace Tickify.Tests.Helpers;

/// <summary>
/// Factory để tạo in-memory database cho testing
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Tạo ApplicationDbContext với in-memory database
    /// </summary>
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new ApplicationDbContext(options);
    }

    /// <summary>
    /// Tạo ApplicationDbContext với tên database cụ thể (để reuse trong cùng test)
    /// </summary>
    public static ApplicationDbContext Create(string databaseName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: databaseName)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new ApplicationDbContext(options);
    }
}

