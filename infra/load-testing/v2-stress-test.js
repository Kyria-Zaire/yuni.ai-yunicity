import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const BASE_URL = __ENV.BASE_URL || 'https://yuni-ai.up.railway.app';

export const options = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_duration{status:200}': ['p(95)<1000'],
    'error_rate': ['rate<0.02'],
  },
};

const CITIES = ['reims', 'troyes', 'chalons-en-champagne'];
const ZONES = ['centre', 'nord', 'sud', 'est', 'ouest'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const roll = Math.random();

  if (roll < 0.4) {
    // 40% — Health check (lightweight)
    const res = http.get(`${BASE_URL}/health`);
    check(res, { 'health 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else if (roll < 0.7) {
    // 30% — Federation stats (public, cached)
    const res = http.get(`${BASE_URL}/v1/federation/stats`);
    check(res, { 'federation 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else if (roll < 0.85) {
    // 15% — Civic metadata (public)
    const city = randomItem(CITIES);
    const res = http.get(`${BASE_URL}/v1/civic/export/${city}/metadata`);
    check(res, { 'civic metadata 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  } else {
    // 15% — Cities list (public)
    const res = http.get(`${BASE_URL}/v1/cities`);
    check(res, { 'cities 200': (r) => r.status === 200 });
    errorRate.add(res.status !== 200);
  }

  sleep(0.5 + Math.random());
}
