import { createHash, createHmac } from "node:crypto";

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function requestSecurityKey(request: Request, discriminator = "") {
  const material = `${clientAddress(request)}|${discriminator.slice(0, 320)}`;
  const secret = process.env.SECURITY_HASH_SECRET?.trim();
  return secret
    ? createHmac("sha256", secret).update(material).digest("hex")
    : createHash("sha256").update(material).digest("hex");
}
