import { Metrics, MetricUnit } from "@aws-lambda-powertools/metrics";
const metrics = new Metrics({ namespace: 'ReadySetCloud', serviceName: 'RealTime' });

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    for (const latencyMetric of body.latencyMetrics) {
      metrics.addDimensions({ ConnectionId: latencyMetric.connectionId, MetricType: latencyMetric.metricType });
      metrics.addMetric('Latency', MetricUnit.Milliseconds, latencyMetric.value);
      metrics.publishStoredMetrics();
    }

    for (const errorMetric of body.errorMetrics) {
      metrics.addDimensions({ ConnectionId: errorMetric.connectionId, MetricType: errorMetric.metricType });
      metrics.addMetric('Errors', MetricUnit.Count, 1);
      metrics.publishStoredMetrics();
    }

    return {
      statusCode: 204
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' })
    };
  }
};
