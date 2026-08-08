export type DatabaseHealth = "unconfigured" | "ready" | "error";

export interface DatabaseStatus {
  health: DatabaseHealth;
  provider: "postgresql";
}
