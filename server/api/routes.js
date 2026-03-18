/**
 * REST API Router — Express routes for the CORTEGE orchestration system.
 * Implements: FR-034, FR-006, FR-032
 *
 * Usage:
 *   import { createApiRouter } from './api/routes.js';
 *   app.use(createApiRouter(orchestrator));
 */

import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EVENTS_DIR = path.resolve('data/events');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the last `limit` events from JSONL files, optionally filtered by date.
 *
 * @param {number}      limit     Max events to return
 * @param {string|null} dateStr   Optional YYYY-MM-DD filter
 * @returns {object[]}
 */
function readRecentEvents(limit, dateStr = null) {
  if (!fs.existsSync(EVENTS_DIR)) return [];

  let files;
  try {
    files = fs.readdirSync(EVENTS_DIR)
      .filter((f) => f.endsWith('.jsonl'))
      .sort()
      .reverse(); // newest first
  } catch {
    return [];
  }

  // If a date filter is provided, restrict to that file only
  if (dateStr) {
    files = files.filter((f) => f.startsWith(dateStr));
  }

  const events = [];

  for (const filename of files) {
    if (events.length >= limit) break;

    const filepath = path.join(EVENTS_DIR, filename);
    let content;
    try {
      content = fs.readFileSync(filepath, 'utf8');
    } catch {
      continue;
    }

    // Read lines in reverse so we get the most recent first
    const lines = content.split('\n').filter((l) => l.trim()).reverse();
    for (const line of lines) {
      if (events.length >= limit) break;
      try {
        events.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// createApiRouter
// ---------------------------------------------------------------------------

/**
 * Creates and returns an Express Router with all CORTEGE REST endpoints.
 *
 * @param {object} orchestrator
 * @param {Array}                          orchestrator.household       Household members array
 * @param {Map<string, AgentInstance>}     orchestrator.agentInstances  Agent instance map
 * @param {object}                         orchestrator.agentFactory    AgentFactory instance
 * @param {import('../ingestion/simulator.js').EventSimulator} orchestrator.simulator
 * @param {import('../orchestrator/event-bus.js').EventBus}    orchestrator.eventBus
 * @returns {Router}
 */
export function createApiRouter(orchestrator) {
  const router = Router();

  // -------------------------------------------------------------------------
  // GET /api/household
  // Returns the household members array.
  // -------------------------------------------------------------------------
  router.get('/api/household', (req, res) => {
    try {
      res.json(orchestrator.household ?? []);
    } catch (err) {
      console.error('[api] GET /api/household error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/companions
  // Returns status snapshot for all agent instances.
  // -------------------------------------------------------------------------
  router.get('/api/companions', (req, res) => {
    try {
      const companions = [];
      for (const instance of orchestrator.agentInstances.values()) {
        companions.push(instance.getStatus());
      }
      res.json(companions);
    } catch (err) {
      console.error('[api] GET /api/companions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/companions/:id
  // Returns status snapshot for a single agent instance.
  // -------------------------------------------------------------------------
  router.get('/api/companions/:id', (req, res) => {
    try {
      const instance = orchestrator.agentInstances.get(req.params.id);
      if (!instance) {
        return res.status(404).json({ error: `Companion "${req.params.id}" not found` });
      }
      res.json(instance.getStatus());
    } catch (err) {
      console.error(`[api] GET /api/companions/${req.params.id} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/companions/:id/memory
  // Returns the full memory store for a single agent instance.
  // -------------------------------------------------------------------------
  router.get('/api/companions/:id/memory', (req, res) => {
    try {
      const instance = orchestrator.agentInstances.get(req.params.id);
      if (!instance) {
        return res.status(404).json({ error: `Companion "${req.params.id}" not found` });
      }

      const memory = instance.memoryStore?.getMemory() ?? instance.memory ?? null;
      if (!memory) {
        return res.status(404).json({ error: `No memory found for companion "${req.params.id}"` });
      }

      res.json(memory);
    } catch (err) {
      console.error(`[api] GET /api/companions/${req.params.id}/memory error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/companions/:id/activity
  // Returns the last N events for a household member.
  // Query params: limit (default 20)
  // -------------------------------------------------------------------------
  router.get('/api/companions/:id/activity', (req, res) => {
    try {
      const instance = orchestrator.agentInstances.get(req.params.id);
      if (!instance) {
        return res.status(404).json({ error: `Companion "${req.params.id}" not found` });
      }

      const limit = Math.min(parseInt(req.query.limit ?? '20', 10) || 20, 200);
      const memberId = instance.getMemberId();

      // Read events and filter to those targeting this member (or broadcast events)
      const allEvents = readRecentEvents(limit * 5); // over-fetch then filter
      const memberEvents = allEvents
        .filter((e) => !e.target_member || e.target_member === memberId)
        .slice(0, limit);

      res.json(memberEvents);
    } catch (err) {
      console.error(`[api] GET /api/companions/${req.params.id}/activity error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/events
  // Returns recent events from JSONL storage.
  // Query params: limit (default 50), date (YYYY-MM-DD, optional)
  // -------------------------------------------------------------------------
  router.get('/api/events', (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 500);
      const date = req.query.date ?? null;

      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format — use YYYY-MM-DD' });
      }

      const events = readRecentEvents(limit, date);
      res.json(events);
    } catch (err) {
      console.error('[api] GET /api/events error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // POST /api/scenarios/:name/run
  // Runs a named scenario via EventSimulator.
  // -------------------------------------------------------------------------
  router.post('/api/scenarios/:name/run', async (req, res) => {
    const { name } = req.params;
    try {
      const result = await orchestrator.simulator.runScenario(name);

      // Simulator returns { error, status: 400 } on failure
      if (result.error) {
        return res.status(result.status ?? 400).json({ error: result.error });
      }

      res.json(result);
    } catch (err) {
      console.error(`[api] POST /api/scenarios/${name}/run error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/agents
  // Returns loaded agent template names.
  // -------------------------------------------------------------------------
  router.get('/api/agents', (req, res) => {
    try {
      // agentFactory exposes templates via loadTemplates; instances carry agentName
      const agentNames = new Set();
      for (const instance of orchestrator.agentInstances.values()) {
        agentNames.add(instance.agentName);
      }
      res.json([...agentNames]);
    } catch (err) {
      console.error('[api] GET /api/agents error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // POST /api/agents/reload
  // Triggers agent factory hot-reload (FR-006, EC6).
  // -------------------------------------------------------------------------
  router.post('/api/agents/reload', async (req, res) => {
    try {
      if (typeof orchestrator.agentFactory?.reload === 'function') {
        await orchestrator.agentFactory.reload();
      } else {
        // Fallback: call the reload export directly if factory exposes instances map
        return res.status(501).json({ error: 'Hot-reload not configured on this orchestrator' });
      }
      res.json({ reloaded: true, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error('[api] POST /api/agents/reload error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/docs
  // Returns API documentation as HTML-rendered markdown.
  // -------------------------------------------------------------------------
  router.get('/api/docs', (req, res) => {
    try {
      const docsPath = path.resolve(__dirname, '../../docs/API.md');
      
      if (!fs.existsSync(docsPath)) {
        return res.status(404).json({ error: 'API documentation not found' });
      }

      const markdown = fs.readFileSync(docsPath, 'utf8');
      
      // Simple HTML wrapper with basic markdown-like styling
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CORTEGE API Documentation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; }
    h3 { color: #7f8c8d; margin-top: 20px; }
    code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.9em;
      color: #e74c3c;
    }
    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
      font-size: 0.85em;
    }
    pre code {
      background: none;
      color: inherit;
      padding: 0;
    }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #3498db;
      color: white;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    .nav {
      background: #34495e;
      color: white;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .nav a {
      color: #3498db;
      margin-right: 15px;
    }
    hr {
      border: none;
      border-top: 2px solid #ecf0f1;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      console.error('[api] GET /api/docs error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

export default createApiRouter;
