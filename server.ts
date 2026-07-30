import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createSocketServer } from "./server/socket-server";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

async function main() {
  const app = next({ dev });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  createSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`\n🏟️  AGENT THUNDERDOME ready at http://localhost:${port}`);
    console.log(`🎮  Mode: ${dev ? "development" : "production"}\n`);
  });
}

main().catch(console.error);
