import { AdminRole } from "@elsystar/database";

export const ROLE_LABELS: Record<AdminRole, string> = {
  ADMIN: "Администратор",
  EDITOR: "Редактор",
  SUPPORT: "Поддержка",
  ANALYST: "Аналитик",
};

const editorRoles = [AdminRole.ADMIN, AdminRole.EDITOR];
const supportRoles = [AdminRole.ADMIN, AdminRole.SUPPORT];
const documentRoles = [AdminRole.ADMIN, AdminRole.EDITOR, AdminRole.SUPPORT];
const analyticsRoles = [AdminRole.ADMIN, AdminRole.ANALYST];

export const ADMIN_ROUTE_PERMISSIONS: Array<{ prefix: string; roles: AdminRole[] }> = [
  { prefix: "/users", roles: [AdminRole.ADMIN] },
  { prefix: "/audit", roles: [AdminRole.ADMIN] },
  { prefix: "/analytics", roles: analyticsRoles },
  { prefix: "/homepage", roles: editorRoles },
  { prefix: "/products", roles: editorRoles },
  { prefix: "/solutions", roles: editorRoles },
  { prefix: "/projects", roles: editorRoles },
  { prefix: "/corporate", roles: editorRoles },
  { prefix: "/content-qa", roles: editorRoles },
  { prefix: "/media", roles: editorRoles },
  { prefix: "/seo", roles: editorRoles },
  { prefix: "/documents", roles: documentRoles },
  { prefix: "/leads", roles: supportRoles },
];

export function rolesForAdminPath(pathname: string) {
  return ADMIN_ROUTE_PERMISSIONS.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.roles ?? Object.values(AdminRole);
}

export function canAccessAdminPath(role: AdminRole, pathname: string) {
  return rolesForAdminPath(pathname).includes(role);
}
