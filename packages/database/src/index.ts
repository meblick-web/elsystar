export type DatabaseHealth = "unconfigured" | "ready" | "error";

export interface DatabaseStatus {
  health: DatabaseHealth;
  provider: "postgresql";
}

export { isDatabaseConfigured, prisma } from "./client";
export * from "./generated/prisma/enums";
