using FluentValidation;
using Tickify.DTOs.User;

namespace Tickify.Validators.User;

/// <summary>
/// Validator cho AssignRoleDto
/// Kiểm tra: RoleId phải hợp lệ
/// </summary>
public class AssignRoleValidator : AbstractValidator<AssignRoleDto>
{
    public AssignRoleValidator()
    {
        // RoleId validation
        RuleFor(x => x.RoleId)
            .GreaterThan(0).WithMessage("RoleId phải lớn hơn 0");
    }
}
