import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Verify the shipped HTML, rather than repeating the content renderer's logic.
// Run npm run build first. JOURNAL_TEST_URL optionally adds live HTTP checks.
const buildDirectory = new URL("../.next/", import.meta.url);
const readBuild = (path) => readFile(new URL(path, buildDirectory), "utf8");
const manifest = JSON.parse(await readBuild("prerender-manifest.json"));
const indexHtml = await readBuild("server/app/blog.html");

function structuredData(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap((match) => JSON.parse(match[1])["@graph"] ?? []);
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

function meta(html, name) {
  return [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributes(match[0]))
    .find((item) => item.name === name || item.property === name)?.content;
}

function canonical(html) {
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => attributes(match[0]));
  const values = links.filter((item) => item.rel === "canonical");
  assert.equal(values.length, 1, "exactly one canonical URL");
  return values[0].href;
}

const collection = structuredData(indexHtml).find((item) => item["@type"] === "CollectionPage");
assert.ok(collection, "index contains collection metadata");
const paths = collection.mainEntity.itemListElement.map((item) => new URL(item.url).pathname);
const sitemap = await readBuild("server/app/sitemap.xml.body");
const descriptions = new Set();

test("index is static, indexable, and links to every article without JavaScript", () => {
  assert.ok(manifest.routes["/blog"]);
  assert.equal([...indexHtml.matchAll(/<h1\b/g)].length, 1);
  assert.equal(new URL(canonical(indexHtml)).pathname, "/blog");
  assert.match(meta(indexHtml, "robots"), /index, follow/);
  assert.ok(paths.length > 0);
  assert.equal(new Set(paths).size, paths.length, "article URLs are unique");
  for (const path of paths) assert.ok(indexHtml.includes(`href="${path}"`));
});

for (const path of paths) {
  test(`${path}: static prose, consistent metadata, valid contents links, and sitemap`, async () => {
    assert.ok(manifest.routes[path], "article is pre-rendered");
    const html = await readBuild(`server/app${path}.html`);
    const graph = structuredData(html);
    const article = graph.find((item) => item["@type"] === "BlogPosting");
    const breadcrumb = graph.find((item) => item["@type"] === "BreadcrumbList");
    assert.ok(article);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.equal(canonical(html), article.url);
    assert.equal(meta(html, "og:url"), article.url);
    assert.equal(meta(html, "description"), article.description);
    assert.equal(meta(html, "og:type"), "article");
    assert.equal(meta(html, "twitter:card"), "summary_large_image");
    assert.match(meta(html, "robots"), /index, follow/);
    assert.equal(breadcrumb.itemListElement.at(-1).item, article.url);
    assert.ok(!descriptions.has(article.description), "description is unique");
    descriptions.add(article.description);
    assert.ok(Date.parse(article.dateModified) >= Date.parse(article.datePublished));
    assert.ok(html.includes(`dateTime="${article.datePublished}"`) || html.includes(`datetime="${article.datePublished}"`));
    const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    assert.ok(visible.includes(article.headline));
    assert.ok(visible.includes(article.author.name));
    assert.ok(visible.includes(article.abstract), "quick answer is visible, not schema-only");
    assert.ok(visible.replace(/<[^>]+>/g, " ").split(/\s+/).length > 300, "full prose is in initial HTML");
    const ids = new Set([...visible.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
    for (const match of visible.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]), `anchor ${match[1]} exists`);
    const entry = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].find((match) => match[1].includes(`<loc>${article.url}</loc>`))?.[1];
    assert.ok(entry, "article is in sitemap");
    const lastModified = entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    assert.equal(Date.parse(lastModified), Date.parse(article.dateModified), "sitemap uses content modification date");
    assert.ok(entry.includes(article.image[0]), "sitemap includes the article image");
  });
}

if (process.env.JOURNAL_TEST_URL) {
  const origin = process.env.JOURNAL_TEST_URL;
  test("HTTP: public articles and crawler responses are accessible; missing posts are 404", async () => {
    for (const path of ["/blog", ...paths]) {
      const response = await fetch(new URL(path, origin), { redirect: "manual" });
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("set-cookie"), null, "public content does not refresh auth cookies");
      assert.equal(response.headers.get("x-nextjs-cache"), "HIT", "production serves static output");
    }
    for (const userAgent of ["Googlebot", "OAI-SearchBot", "bingbot"]) {
      const crawler = await fetch(new URL(paths[0], origin), { headers: { "user-agent": userAgent } });
      assert.equal(crawler.status, 200, userAgent);
      assert.equal(canonical(await crawler.text()), new URL(paths[0], collection.url).href);
    }
    const missing = await fetch(new URL("/blog/this-post-does-not-exist", origin), { redirect: "manual" });
    assert.equal(missing.status, 404);
    const missingHtml = await missing.text();
    assert.match(meta(missingHtml, "robots"), /noindex/);
    const visibleMissing = missingHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
    assert.ok(visibleMissing.includes("این صفحه پیدا نشد."), "missing articles include Persian recovery in HTML, not just serialized data");
    assert.ok(visibleMissing.includes('href="/blog"'), "404 offers a link back to the journal");
  });

  test("HTTP: account and saved-product routes still require login", async () => {
    for (const path of ["/account", "/account/saved"]) {
      const response = await fetch(new URL(path, origin), { redirect: "manual" });
      assert.equal(response.status, 307);
      const location = new URL(response.headers.get("location"), origin);
      assert.equal(location.pathname, "/login");
      assert.equal(location.searchParams.get("next"), path);
    }
  });
}
