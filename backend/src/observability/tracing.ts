import { trace, SpanStatusCode } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

let sdk: NodeSDK | null = null;

export async function startTracing() {
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!otelEndpoint) return;
  if (sdk) return;

  sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: `${otelEndpoint.replace(/\/$/, '')}/v1/traces` }),
    instrumentations: [getNodeAutoInstrumentations()]
  });

  await sdk.start();

  const shutdown = async () => {
    if (!sdk) return;
    await sdk.shutdown();
    sdk = null;
  };
  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}

export function getTracer(name = 'gharpayy-backend') {
  return trace.getTracer(name);
}

export async function withSpan<T>(name: string, fn: () => Promise<T>, attributes?: Record<string, string | number | boolean>) {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => span.setAttribute(key, value));
    }
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message ?? 'span error' });
      span.end();
      throw error;
    }
  });
}
