using FluentValidation;
using Tickify.DTOs.User;

namespace Tickify.Validators.User;


public class AssignRoleValidator : AbstractValidator<AssignRoleDto>
{
    public AssignRoleValidator()
    {
        RuleFor(x => x.RoleId)
            .GreaterThan(0).WithMessage("RoleId phải lớn hơn 0");
    }
}
