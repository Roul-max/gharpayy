import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 30,
  duration: '5m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

export default function () {
  if (__ENV.SKIP_LIST !== '1') {
    const list = http.get(`${BASE_URL}/public/properties?pageSize=12`);
    check(list, { 'list status 200': (r) => r.status === 200 });
    if (__ENV.DEBUG_ERRORS === '1' && list.status !== 200) {
      console.log(`list ${list.status} ${list.body?.slice(0, 200)}`);
    }

    let propertyId = null;
    try {
      const payload = list.json();
      propertyId = payload?.data?.[0]?.id ?? null;
    } catch {
      propertyId = null;
    }

    if (propertyId) {
      const detail = http.get(`${BASE_URL}/public/properties/${propertyId}`);
      check(detail, { 'detail status 200': (r) => r.status === 200 });
      if (__ENV.DEBUG_ERRORS === '1' && detail.status !== 200) {
        console.log(`detail ${detail.status} ${detail.body?.slice(0, 200)}`);
      }
    }
  }

  if (__ENV.SKIP_CAPTURE !== '1') {
    const leadPayload = JSON.stringify({
      name: `k6-user-${Math.random().toString(36).slice(2, 8)}`,
      phone: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
      source: 'website'
    });
    const capture = http.post(`${BASE_URL}/public/capture`, leadPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    check(capture, { 'capture status 201/200': (r) => r.status === 201 || r.status === 200 });
    if (__ENV.DEBUG_ERRORS === '1' && capture.status !== 201 && capture.status !== 200) {
      console.log(`capture ${capture.status} ${capture.body?.slice(0, 200)}`);
    }
  }

  sleep(1);
}
