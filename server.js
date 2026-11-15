const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  let requestedPath;
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    requestedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  } catch {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  const filePath = path.resolve(root, `.${requestedPath}`);

  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      const status = error.code === "ENOENT" || error.code === "EISDIR" ? 404 : 500;
      res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(status === 404 ? "Not found" : "Unable to read requested file");
      return;
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(content);
  });
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => {
  const address = server.address();
  const runningPort = typeof address === "object" && address ? address.port : port;
  console.log(`Kadenoh demo is running at http://localhost:${runningPort}`);
});
