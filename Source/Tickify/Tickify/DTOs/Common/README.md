# Common DTOs Convention

## Purpose
Avoid circular dependencies and ensure consistency across all modules.

## Usage
All developers should use these Common DTOs instead of direct dependencies.

## Available Common DTOs:
- `BasicUserInfo` - For user references
- `BasicEventInfo` - For event references  
- `BasicBookingInfo` - For booking references
- `BasicOrganizerInfo` - For organizer references

## Rules:
1. ✅ DO use Common DTOs for nested object references
2. ✅ DO keep Common DTOs minimal with only essential fields
3. ❌ DON'T create circular dependencies between modules
4. ❌ DON'T add business logic to Common DTOs