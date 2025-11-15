using FluentValidation;
using Tickify.DTOs.User;

namespace Tickify.Validators.User;

public class AssignRoleDtoValidator : AbstractValidator<AssignRoleDto>
{
    public AssignRoleDtoValidator()
    {
        RuleFor(x => x.RoleId)
            .GreaterThan(0).WithMessage("RoleId không hợp lệ");
    }
}
