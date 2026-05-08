import "dotenv/config";
import { serve } from "@hono/node-server";

import { app } from "./app.js";

const port = Number(process.env.PORT ?? 8402);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`🛡️  TalosFacilitator running on http://localhost:${info.port}`);
    console.log(`   Network: Arc Testnet (eip155:5042002)`);
    console.log(`   Endpoints: GET /, GET /supported, POST /verify, POST /settle`);
  }
);
