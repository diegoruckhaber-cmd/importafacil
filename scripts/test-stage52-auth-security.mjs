import assert from "node:assert/strict";
import fs from "node:fs";

const auth = fs.readFileSync("app/auth/page.tsx", "utf8");
assert.match(auth, /resetPasswordForEmail/);
assert.match(auth, /PASSWORD_RECOVERY/);
assert.match(auth, /updateUser\(\{ password \}\)/);
assert.match(auth, /auth\.signOut\(\)/);
assert.match(auth, /value\.length < 10/);
assert.match(auth, /\[A-Z\]/);
assert.match(auth, /\[a-z\]/);
assert.match(auth, /\[0-9\]/);
assert.match(auth, /\[\^A-Za-z0-9\]/);
assert.match(auth, /Se existir uma conta para este e-mail/);
assert.match(auth, /autocomplete/i);
assert.doesNotMatch(auth, /conta não existe/i);

const doc = fs.readFileSync("docs/stage52-auth-security.md", "utf8");
assert.match(doc, /Leaked Password Protection/);
assert.match(doc, /Pro plans and above/);

console.log("Stage 52 auth security regression passed.");
