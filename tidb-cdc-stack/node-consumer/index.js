const { Kafka } = require('kafkajs');
const express = require('express');
const client = require('prom-client');

// ---- Config ----
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',').map(s => s.trim());
const topic = process.env.TOPIC || 'tidb-cdc';
const promPort = Number(process.env.PROM_PORT || 3000);
const groupId = process.env.GROUP_ID || 'cdc-node-consumer-group';

// ---- Prometheus ----
const register = new client.Registry();
client.collectDefaultMetrics({ register }); // process metrics

const cdcCounter = new client.Counter({
  name: 'cdc_events_total',
  help: 'Total CDC events by table and operation',
  labelNames: ['table', 'op'],
});
register.registerMetric(cdcCounter);

// ---- HTTP (health/metrics) ----
const app = express();
app.get('/healthz', (_req, res) => res.status(200).send('ok'));
app.get('/readyz', (_req, res) => res.status(ready ? 200 : 503).send(ready ? 'ready' : 'not-ready'));
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

let ready = false;

// ---- Kafka ----
const kafka = new Kafka({
  clientId: 'cdc-node-consumer',
  brokers: kafkaBrokers,
  retry: { retries: 8, initialRetryTime: 300, factor: 1.8 },
  requestTimeout: 30000,
});

function countEvent(evt) {
  // TiCDC canal-json typical shape:
  // { "type":"INSERT|UPDATE|DELETE", "table":"db.table" or "table":"table" + "database":"db", "data":[{...}], "old":[{...}] }
  const op = (evt?.type || 'unknown').toLowerCase();
  // normalize table: prefer evt.table (may be "users" or "testdb.users")
  let table = evt?.table || 'unknown';
  if (table.includes('.')) table = table.split('.').pop(); // keep only table name
  cdcCounter.inc({ table, op }, 1);
}

async function run() {
  const consumer = kafka.consumer({ groupId, allowAutoTopicCreation: false });

  consumer.on(consumer.events.GROUP_JOIN, e => {
    console.log(`[consumer] group join:`, {
      groupId, memberId: e.payload?.memberId, leader: e.payload?.isLeader
    });
  });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });
  //console.log(`[startup] Subscribed to ${topic} on ${kafkaBrokers.join(', ')}`);

  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString() || '';
      // לוג נקי ל-stdout (קל לגרף עם Filebeat)
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        level: 'info',
        msg: 'cdc-event',
        topic, partition, offset: message.offset,
        key: message.key?.toString() || null,
        raw
      }));

      try {
        const evt = JSON.parse(raw);
        countEvent(evt);
      } catch (e) {
        console.error(JSON.stringify({
          ts: new Date().toISOString(),
          level: 'error',
          msg: 'parse-error',
          error: e.message,
          rawSample: raw.slice(0, 256)
        }));
      }
    },
  });

  ready = true;
  app.listen(promPort, () =>{}
    //console.log(`[metrics] listening on :${promPort}/metrics`)
  );

  // graceful shutdown
  const shutdown = async (sig) => {
    console.log(`[shutdown] received ${sig}, closing...`);
    try { await consumer.disconnect(); } catch {}
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

run().catch(err => {
  console.error('[fatal]', err);
  process.exit(1);
});
