/**
 * CORTEGE Agent Orchestration Server
 * Entry point — starts Express REST API + WebSocket server
 */

import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import { createWebSocketServer } from './api/websocket.js';
import { createApiRouter } from './api/routes.js';
import { createManualRouter } from './ingestion/manual.js';
import { createTwilioRouter } from './ingestion/twilio-webhook.js';
import { Orchestrator } from './orchestrator/orchestrator.js';
import eventBus from './orchestrator/event-bus.js';

const PORT = process.env.PORT || 3001;

async function main() {
  // 1. Create Express app
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // 2. Create HTTP server
  const httpServer = http.createServer(app);

  // 3. Create orchestrator (needed before ws so we can pass it)
  const orchestrator = new Orchestrator({
    enableHouseholdStore: true
  });

  // 4. Create WebSocket server
  const { ws } = createWebSocketServer(httpServer, orchestrator);

  // 5. Boot orchestrator
  await orchestrator.start(ws);

  // 6. Mount API routers
  app.use(createApiRouter(orchestrator));
  app.use('/api/events', createManualRouter(eventBus));
  app.use('/ingest/twilio', createTwilioRouter({
    householdStore: orchestrator.householdStore,
    eventBus,
  }));

  // 7. Start HTTP server
  httpServer.listen(PORT, () => {
    console.log(`[cortege] CORTEGE orchestration server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[cortege] Fatal startup error:', err);
  process.exit(1);
});
