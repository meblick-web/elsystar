import { isDatabaseConfigured, prisma } from "@elsystar/database";

export async function GET(request: Request, { params }: { params: Promise<{ legacy: string[] }> }) {
  const { legacy } = await params;
  const path = `/${legacy.join("/")}`;

  if (isDatabaseConfigured() && prisma) {
    try {
      const rule = await prisma.redirectRule.findUnique({ where: { fromPath: path } });
      if (rule?.enabled) {
        const target = new URL(rule.toPath, request.url);
        return Response.redirect(target, rule.status === 302 ? 302 : 301);
      }
    } catch (error) {
      console.error("redirect_rule_query_failed", error);
    }
  }

  return new Response("Not Found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
}
