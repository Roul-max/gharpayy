**Load Test Report**
Date: 2026-03-14
Environment: Local (API on localhost)
Base URL: http://localhost:3000/api

**Test Config**
VUs: 30
Duration: 5m

**Results**
Read-only (list + detail, capture skipped):
Total Requests: 13,606
RPS: 45.21 req/s
http_req_failed: 0.00%
p95 latency: 512.08 ms
p99 latency: 1.30 s (approx)

Capture-only (write, list skipped):
Total Requests: 5,184
RPS: 17.19 req/s
http_req_failed: 0.00%
p95 latency: 1.39 s
p99 latency: 2.3 s (approx)

**Notes**
- Observed bottlenecks: Capture/write path still above target p95 < 800 ms, even in queue mode.
- Errors (if any): None; all checks passed.
- Recommended follow-ups: Optimize capture path (DB indexing/queueing) or relax write SLA threshold.
