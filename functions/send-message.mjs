import { TopicClient, TopicPublishResponse } from "@gomomento/sdk";
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
const WS_POST_URL = '<REPLACE ME>';

const metrics = new Metrics({ namespace: 'ReadySetCloud', serviceName: 'RealTime' });
const topicClient = new TopicClient({});

export const handler = async (event) => {
  try {
    const topicClock = await publishToTopics();
    const wsClock = await publishToWebSocket();
    return { statusCode: 200, body: JSON.stringify({ wsClock, topicClock }) };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' })
    };
  }
};

const publishToWebSocket = async () => {
  const now = Date.now();
  const response = await fetch(WS_POST_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.WS_API_KEY
    },
    body: JSON.stringify({
      channel: '/emoji/benchmark',
      events: [JSON.stringify({ timestamp: now })]
    })
  });
  if (response.ok) {
    const time = Date.now() - now;
    const data = await response.json();
    if (data.successful.length > 0) {
      recordLatencyMetric('WebSocket', time);
      recordSuccessMetric('WebSocket', true);
    } else {
      recordSuccessMetric('WebSocket', false);
    }
  } else {
    recordSuccessMetric('WebSocket', false);
  }

  return now;
};

const publishToTopics = async () => {
  const now = Date.now();
  const response = await topicClient.publish('connection', 'notification', now.toString());
  if (response.type == TopicPublishResponse.Success) {
    const time = Date.now() - now;
    recordLatencyMetric('Topics', time);
    recordSuccessMetric('Topics', true);
  } else {
    recordSuccessMetric('Topics', false);
  }

  return now;
};

const recordLatencyMetric = (metricType, latency) => {
  metrics.addDimensions({ MetricType: metricType });
  metrics.addMetric('PublishTime', MetricUnit.Milliseconds, latency);
  metrics.publishStoredMetrics();
};

const recordSuccessMetric = (metricType, isSuccess) => {
  metrics.addDimensions({ MetricType: metricType });
  const metric = isSuccess ? 'Successful_Sends' : 'Failed_Sends';
  metrics.addMetric(metric, MetricUnit.Count, 1);
  metrics.publishStoredMetrics();
};
