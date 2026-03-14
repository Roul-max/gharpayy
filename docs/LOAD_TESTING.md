**Load Testing Guide**

**Goal**
Validate readiness for 10k+ daily visits by measuring RPS, p95 latency, and error rates on public endpoints.

**Prerequisites**
1. Install k6: `https://k6.io/docs/get-started/installation/`
2. Ensure backend is reachable from the machine running the test.

**Run (local)**
```bash
k6 run load-tests/k6-public-traffic.js
```

**Run (staging/prod)**
```bash
BASE_URL=https://your-domain.com/api k6 run load-tests/k6-public-traffic.js
```

**Success Criteria (default)**
1. `http_req_failed < 1%`
2. `p95 < 800ms`

**Report Template**
Fill this after each run and keep in `docs/load_test_report.md`.

```markdown
**Load Test Report**
Date:
Environment:
Base URL:

**Test Config**
VUs:
Duration:

**Results**
Total Requests:
RPS:
http_req_failed:
p95 latency:
p99 latency:

**Notes**
- Observed bottlenecks:
- Errors (if any):
- Recommended follow-ups:
```
