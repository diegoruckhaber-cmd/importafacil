import assert from "node:assert/strict";
import fs from "node:fs";

const layout=fs.readFileSync("app/layout.tsx","utf8");
const home=fs.readFileSync("app/page.tsx","utf8");
const css=fs.readFileSync("app/globals.css","utf8");
const next=fs.readFileSync("next.config.ts","utf8");
const sitemap=fs.readFileSync("app/sitemap.ts","utf8");
const manifest=fs.readFileSync("app/manifest.ts","utf8");
const notFound=fs.readFileSync("app/not-found.tsx","utf8");

assert.match(layout,/metadataBase: new URL\(PUBLIC_SITE_URL\)/);
assert.match(layout,/alternates: \{ canonical: "\/" \}/);
assert.match(layout,/Pular para o conteúdo principal/);
assert.match(layout,/id="conteudo-principal"/);
assert.match(layout,/aria-label="Status de disponibilidade do produto"/);

assert.doesNotMatch(home,/["']use client["']/);
assert.doesNotMatch(home,/\bfetch\s*\(/);
assert.match(home,/aria-label="Navegação principal"/);
assert.match(home,/aria-labelledby="home-hero-title"/);
assert.match(home,/id="home-hero-title"/);

assert.match(css,/\.skipLink/);
assert.match(css,/:focus-visible/);
assert.match(css,/prefers-reduced-motion/);
assert.match(css,/@media\(max-width:520px\)/);

assert.match(next,/compress: true/);
assert.match(next,/productionBrowserSourceMaps: false/);
assert.match(next,/poweredByHeader: false/);

for(const path of ["/simulacao-v2","/regras","/privacidade","/termos"]) assert.ok(sitemap.includes(path));
assert.match(manifest,/display: "standalone"/);
assert.match(manifest,/lang: "pt-BR"/);
assert.match(notFound,/Esta página não existe/);
assert.match(notFound,/href="\/simulacao-v2"/);

console.log("Stage 60 performance and quality regression passed.");
