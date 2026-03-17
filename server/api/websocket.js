/**
 * WebSocket Server — Real-time event emission for the CORTEGE orchestration system.
 * Implements: FR-035, FR-036, EC7
 *
 * Usage:
 *   import { createWebSocketServer } from './api/websocket.js';
 *   const { ws, broadcast } = createWebSocketServer(httpServer, orchestrator);
 *
 * The returned `ws(eventName, data)` function is the emitter used throughout
 * the codebase (agent-instance, escalation-handler, etc.).
 */

import { WebSocketServer } from 'ws';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum escalation events to buffer when no clients are connected (EC7). */
const ESCALATION_QUEUE_MAX = 50;

/** Event names that are considered escalation events and should be queued. */
const ESCALATION_EVENT_NAMES = new Set(['escalation:fired']);

// ---------------------------------------------------------------------------
// createWebSocketServer
// ---------------------------------------------------------------------------

/**
 * Creates a WebSocket server attached to an existing HTTP server.
 *
 * @param {import('http').Server} httpServer  The HTTP server to attach to
 * @param {object}                orchestrator  Orchestrator context (reserved for future use)
 * @returns {{ ws: Function, broadcast: Function, wss: WebSocketServer }}
 */
export function createWebSocketServer(httpServer, orchestrator) {
  // Set of currently connected WebSocket clients
  const clients = new Set();

  // Circular buffer for queued escalation events (EC7)
  // Stored as { event: string, data: object, timestamp: string }
  const escalationQueue = [];

  // -------------------------------------------------------------------------
  // WebSocket server setup
  // -------------------------------------------------------------------------

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket, req) => {
    const clientAddr = req.socket.remoteAddress ?? 'unknown';
    console.log(`[ws] Client connected from ${clientAddr} (total: ${clients.size + 1})`);

    clients.add(socket);

    // EC7: Flush queued escalation events to the newly connected client
    if (escalationQueue.length > 0) {
      console.log(`[ws] Flushing ${escalationQueue.length} queued escalation event(s) to new client`);
      for (const queued of escalationQueue) {
        _sendToSocket(socket, queued);
      }
      // Clear the queue once flushed (all queued events delivered)
      escalationQueue.length = 0;
    }

    socket.on('close', () => {
      clients.delete(socket);
      console.log(`[ws] Client disconnected (remaining: ${clients.size})`);
    });

    socket.on('error', (err) => {
      console.error(`[ws] Socket error from ${clientAddr}:`, err.message);
      clients.delete(socket);
    });
  });

  wss.on('error', (err) => {
    console.error('[ws] WebSocket server error:', err.message);
  });

  console.log('[ws] WebSocket server listening at /ws');

  // -------------------------------------------------------------------------
  // broadcast
  // -------------------------------------------------------------------------

  /**
   * Sends a named event to all connected WebSocket clients.
   * If no clients are connected and the event is an escalation event,
   * it is queued for delivery on the next client connect (EC7).
   *
   * @param {string} eventName  e.g. "agent:response", "escalation:fired"
   * @param {object} data       Payload to send
   */
  function broadcast(eventName, data) {
    const message = {
      event: eventName,
      data,
      timestamp: new Date().toISOString(),
    };

    if (clients.size === 0) {
      // No clients connected — queue escalation events for later delivery (EC7)
      if (ESCALATION_EVENT_NAMES.has(eventName)) {
        escalationQueue.push(message);
        // Enforce circular buffer limit — drop oldest if over capacity
        if (escalationQueue.length > ESCALATION_QUEUE_MAX) {
          escalationQueue.shift();
        }
        console.log(`[ws] No clients connected — queued escalation event "${eventName}" (queue size: ${escalationQueue.length})`);
      }
      return;
    }

    const payload = JSON.stringify(message);
    let sent = 0;
    let failed = 0;

    for (const socket of clients) {
      if (socket.readyState === socket.OPEN) {
        try {
          socket.send(payload);
          sent++;
        } catch (err) {
          console.error(`[ws] Failed to send "${eventName}" to client:`, err.message);
          failed++;
          clients.delete(socket);
        }
      } else {
        // Socket is closing/closed — remove it
        clients.delete(socket);
      }
    }

    if (failed > 0) {
      console.warn(`[ws] broadcast "${eventName}": sent=${sent} failed=${failed}`);
    }
  }

  // -------------------------------------------------------------------------
  // ws — the emitter function used throughout the codebase
  // -------------------------------------------------------------------------

  /**
   * Emitter function compatible with the ws(eventName, data) signature
   * used in agent-instance.js, escalation-handler.js, etc.
   *
   * @param {string} eventName
   * @param {object} data
   */
  function ws(eventName, data) {
    broadcast(eventName, data);
  }

  return { ws, broadcast, wss };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Sends a pre-built message object to a single socket.
 *
 * @param {WebSocket} socket
 * @param {object}    message  Already-formed { event, data, timestamp }
 */
function _sendToSocket(socket, message) {
  if (socket.readyState !== socket.OPEN) return;
  try {
    socket.send(JSON.stringify(message));
  } catch (err) {
    console.error('[ws] Failed to send queued message to socket:', err.message);
  }
}

export default createWebSocketServer;
