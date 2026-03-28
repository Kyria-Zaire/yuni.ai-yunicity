import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("error_rate");
const cacheHitRate = new Rate("cache_hit_rate");

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "5m", target: 200 },
    { duration: "3m", target: 500 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    "http_req_duration{status:200}": ["p(95)<800"],
    error_rate: ["rate<0.01"],
    cache_hit_rate: ["rate>0.70"],
  },
};

const INTERESTS = [
  ["sport"],
  ["culture"],
  ["environnement"],
  ["sport", "culture"],
  ["famille", "culture"],
];

const TEST_JWT = __ENV.TEST_JWT;
const BASE_URL =
  __ENV.BASE_URL || "https://yuni-ai-recette.up.railway.app";

export default function () {
  const interests = INTERESTS[Math.floor(Math.random() * INTERESTS.length)];
  const userHash = Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

  const payload = JSON.stringify({
    user_id_hash: userHash,
    city: "reims",
    interests: interests,
    points: Math.floor(Math.random() * 10) * 100,
    geo: { lat_truncated: 49.25, lng_truncated: 4.03 },
  });

  const response = http.post(`${BASE_URL}/v1/recommend/engagement`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TEST_JWT}`,
    },
    timeout: "10s",
  });

  const success = check(response, {
    "status is 200": (r) => r.status === 200,
    "has actors": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && Array.isArray(body.data.actors);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      cacheHitRate.add(body.meta && body.meta.source === "yuni_ai_cache");
    } catch {
      /* ignore parse errors */
    }
  }

  sleep(Math.random() * 2 + 1);
}
