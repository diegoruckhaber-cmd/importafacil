import assert from "node:assert/strict";
import fs from "node:fs";

const api=fs.readFileSync("app/api/beta-feedback/route.ts","utf8");
assert.match(api,/MAX_FEEDBACK_PER_HOUR = 10/);
assert.match(api,/Date\.now\(\) - 60 \* 60 \* 1000/);
assert.match(api,/select\("id", \{ count: "exact", head: true \}\)/);
assert.match(api,/\.eq\("user_id", user\.id\)/);
assert.match(api,/\.gte\("created_at", oneHourAgo\)/);
assert.match(api,/quota_check_failed/);
assert.match(api,/hourly_quota_exceeded/);
assert.match(api,/status: 429/);
assert.match(api,/"Retry-After": "3600"/);
assert.match(api,/status: 503/);

const doc=fs.readFileSync("docs/stage63-beta-feedback-abuse-guard.md","utf8");
assert.match(doc,/10 feedback records/i);
assert.match(doc,/fails closed/i);
assert.match(doc,/never reads another user's feedback/i);

console.log("Stage 63 beta feedback abuse guard regression passed.");
