import { SetMetadata } from '@nestjs/common';
import { GroupRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for accessing a route.
 * Used with RolesGuard to enforce role-based access control.
 *
 * @example
 * @Roles(GroupRole.ADMIN)
 * @Post(':id/invite')
 * inviteMember() { ... }
 *
 * @example
 * @Roles(GroupRole.ADMIN, GroupRole.MEMBER)
 * @Get(':id')
 * getGroup() { ... }
 */
export const Roles = (...roles: GroupRole[]) => SetMetadata(ROLES_KEY, roles);
