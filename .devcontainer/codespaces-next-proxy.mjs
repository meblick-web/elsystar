import http from "node:http";
import net from "node:net";

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const listenPort = Number(readArg("--listen"));
const targetPort = Number(readArg("--target"));
const allowedHost = readArg("--allowed-host");

if (!listenPort || !targetPort || !allowedHost) {
  console.error("Usage: node codespaces-next-proxy.mjs --listen <port> --target <port> --allowed-host <host>");
  process.exit(1);
}

function normalizedHeaders(input) {
  const headers = { ...input };
  const origin = typeof headers.origin === "string" ? headers.origin : null;
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === allowedHost) {
        headers.host = allowedHost;
        headers["x-forwarded-host"] = allowedHost;
        headers["x-forwarded-proto"] = "https";
      }
    } catch {
      // Preserve original headers for malformed or non-URL Origin values.
    }
  }
  return headers;
}

const server = http.createServer((request, response) => {
  const upstream = http.request({
    hostname: "127.0.0.1",
    port: targetPort,
    path: request.url,
    method: request.method,
    headers: normalizedHeaders(request.headers),
  }, (upstreamResponse) => {
    response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });

  upstream.on("error", (error) => {
    console.error("proxy_upstream_error", error);
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    response.end("Preview upstream unavailable");
  });

  request.pipe(upstream);
});

server.on("upgrade", (request, socket, head) => {
  const upstream = net.connect(targetPort, "127.0.0.1", () => {
    const headers = normalizedHeaders(request.headers);
    const lines = [`${request.method} ${request.url} HTTP/${request.httpVersion}`];
    for (const [key, rawValue] of Object.entries(headers)) {
      if (rawValue === undefined) continue;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of values) lines.push(`${key}: ${value}`);
    }
    upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });

  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});

server.listen(listenPort, "0.0.0.0", () => {
  console.log(`[ELSYSTAR] Codespaces proxy ${listenPort} -> ${targetPort}; allowed host ${allowedHost}`);
});
