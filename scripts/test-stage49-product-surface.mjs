import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("app/page.tsx", "utf8");
assert.match(home, /href="\/simulacao-v2"/);
assert.match(home, /Abrir Simulation V2/);
assert.match(home, /href="\/upgrade"/);
assert.match(home, /BETA CONTROLADO/);
assert.doesNotMatch(home, /Quero ser avisado/);

const auth = fs.readFileSync("app/auth/page.tsx", "utf8");
assert.match(auth, /window\.location\.origin \+ "\/auth"/);
assert.doesNotMatch(auth, /importafacil-projetovendas\.vercel\.app\/auth/);

const login = fs.readFileSync("app/login/page.tsx", "utf8");
assert.match(login, /redirect\("\/auth"\)/);
assert.doesNotMatch(login, /signInWithPassword/);

const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
assert.match(sitemap, /https:\/\/importafacil-gamma\.vercel\.app/);

const robots = fs.readFileSync("app/robots.ts", "utf8");
for (const path of ["/api/", "/dashboard", "/sc-test", "/sc-federal-test", "/sc-save-test"]) {
  assert.ok(robots.includes(`"${path}"`), "robots must disallow " + path);
}

console.log("Stage 49 product surface consolidation regression passed.");
