import WebSocket from 'ws';
import { TopicClient, TopicSubscribeResponse } from '@gomomento/sdk';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics({ namespace: 'ReadySetCloud', serviceName: 'RealTime' });
const topicClient = new TopicClient({});

const AVG_CLOCK_DRIFT = 0;

const wsAuth = {
  host: '<REPLACE ME>',
  'x-api-key': '<REPLACE ME>'
};

const encodedAuth = Buffer.from(JSON.stringify(wsAuth)).toString('base64').replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
const taskName = createTaskName();

const WEBSOCKET_URL = '<REPLACE ME>/event/realtime';
const CONNECTIONS = 10;

const wsConnections = [];
const topicSubscriptions = [];

function connect(id) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WEBSOCKET_URL, [`header-${encodedAuth}`, 'aws-appsync-event-ws']);

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'connection_init' }));
      console.log(`Connection ${taskName}-${id} opened`);
      resolve(ws);
    });

    ws.on('message', async (message) => {
      const msg = JSON.parse(message.toString());
      if (msg.type == 'data') {
        const data = JSON.parse(msg.event);
        const deliveryTime = Date.now() - data.timestamp + AVG_CLOCK_DRIFT;
        recordLatencyMetric(`${taskName}-${id.toString()}`, 'WebSocket', deliveryTime);
        console.log(`Received message from connection ${taskName}-${id}: Delivery Time: ${deliveryTime}ms`);
      }
    });

    ws.on('close', () => {
      console.log(`Connection ${taskName}-${id} closed`);
    });

    ws.on('error', (error) => {
      console.error(`Connection ${taskName}-${id} encountered error:`, error);
      recordErrorMetric(`${taskName}-${id.toString()}`, 'WebSocket');
      reject(error);
    });
  });
}

async function createConnections() {
  for (let i = 0; i < CONNECTIONS; i++) {
    try {
      const ws = await connect(i);
      wsConnections.push(ws);

      // const sub = await topicClient.subscribe('connection', 'notification', {
      //   onItem: async (item) => {
      //     const deliveryTime = Date.now() - Number(item.value());
      //     recordLatencyMetric(`${taskName}-${i.toString()}`, 'Topics', deliveryTime);
      //     console.log(`Received message from topic ${taskName}-${i}: Delivery Time: ${deliveryTime}ms`);
      //   },
      //   onError: (error) => {
      //     console.error(`Error in subscription ${taskName}-${i}:`, error);
      //     recordErrorMetric(`${taskName}-${i.toString()}`, 'Topics');
      //   }
      // });
      // if(sub.type === TopicSubscribeResponse.Subscription){
      //   topicSubscriptions.push(sub);
      // }
    } catch (error) {
      console.error(`Failed to open connection ${taskName}-${i}`, error);
    }
  }
  console.log(`${wsConnections.length} WebSocket connections established`);
  console.log(`${topicSubscriptions.length} Topic subscriptions established`);
}

function subscribeConnections() {
  wsConnections.forEach((ws, id) => {
    if (ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        id: `${taskName}-${id}`,
        type: 'subscribe',
        channel: '/emoji/benchmark',
        authorization: wsAuth
      });
      ws.send(message);
    }
  });
}

async function recordLatencyMetric(connectionId, metricType, latency) {
  // metrics.addDimensions({ ConnectionId: connectionId, MetricType: metricType });
  // metrics.addMetric('Latency', MetricUnit.Milliseconds, latency);
  // metrics.publishStoredMetrics();

  fetch('<REPLACE ME>', {
    method: 'POST',
    body: JSON.stringify({
      latencyMetrics: [{ connectionId, metricType, value: latency }]
    })
  });
}

async function recordErrorMetric(connectionId, metricType) {
  // metrics.addDimensions({ ConnectionId: connectionId, MetricType: metricType });
  // metrics.addMetric('Errors', MetricUnit.Count, 1);
  // metrics.publishStoredMetrics();
  fetch('<REPLACE ME>', {
    method: 'POST',
    body: JSON.stringify({
      latencyMetrics: [{ connectionId, metricType, value: latency }]
    })
  });
}

async function runBenchmark() {
  await createConnections();
  subscribeConnections();
}

runBenchmark().catch((error) => {
  console.error('Error running benchmark:', error);
});

function createTaskName() {
  return Array.from({ length: 4 }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 65)).join('');
}
