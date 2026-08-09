import { SESSION_ADMIN_ROLES, SessionAdminRole } from "./session-token";

export const ROLE_LABELS: Record<SessionAdminRole, string> = {
  ADMIN: "Администратор",
  EDITOR: "Редактор",
  SUPPORT: "Поддержка",
  ANALYST: "Аналитик",
};

const editorRoles: SessionAdminRole[] = ["ADMIN", "EDITOR"];
const supportRoles: SessionAdminRole[] = ["ADMIN", "SUPPORT"];
const documentRoles: SessionAdminRole[] = ["ADMIN", "EDITOR", "SUPPORT"];
const analyticsRoles: SessionAdminRole[] = ["ADMIN", "ANALYST"];

export const ADMIN_ROUTE_PERMISSIONS: Array<{ prefix: string; roles: SessionAdminRole[] }> = [
  { prefix: "/users", roles: ["ADMIN"] },
  { prefix: "/audit", roles: ["ADMIN"] },
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
  return ADMIN_ROUTE_PERMISSIONS.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.roles ?? [...SESSION_ADMIN_ROLES];
}

export function canAccessAdminPath(role: SessionAdminRole, pathname: string) {
  return rolesForAdminPath(pathname).includes(role);
}
