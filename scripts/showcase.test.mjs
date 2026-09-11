import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Test generated production output, including the publication/crawling boundary.
const readBuild = (path) => readFile(new URL(`../.next/${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(await readBuild("prerender-manifest.json"));
const routes = JSON.parse(await readBuild("routes-manifest.json"));
const sitemap = await readBuild("server/app/sitemap.xml.body");
const home = await readBuild("server/app/index.html");
const graph = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((match) => JSON.parse(match[1])["@graph"] ?? []);
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
const meta = (html, name) => [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributes(match[0])).find((item) => item.name === name || item.property === name)?.content;
const visible = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const canonical = (html) => {
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => attributes(match[0])).filter((item) => item.rel === "canonical");
  assert.equal(links.length, 1);
  return links[0].href;
};
const descriptions = new Set();
const allPaths = [];

function checkPage(html, path, type) {
  assert.ok(manifest.routes[path], `${path} is pre-rendered`);
  const body = visible(html);
  assert.equal([...body.matchAll(/<h1\b/g)].length, 1, "one H1");
  assert.equal(new URL(canonical(html)).pathname, path);
  assert.equal(meta(html, "og:url"), canonical(html));
  assert.equal(meta(html, "twitter:card"), "summary_large_image");
  assert.ok(meta(html, "og:image"));
  assert.match(meta(html, "robots"), /noindex, follow/, "demo must not be indexed");
  assert.ok(!body.includes("نسخه نمایشی"), "removed notice is absent");
  assert.ok(!sitemap.includes(`<loc>${canonical(html)}</loc>`), "demo is excluded from sitemap");
  const schema = graph(html);
  const page = schema.find((item) => item["@type"] === type);
  assert.equal(page.url, canonical(html));
  assert.equal(page.description, meta(html, "description"));
  assert.ok(!descriptions.has(page.description), "unique page description");
  descriptions.add(page.description);
  assert.equal(schema.find((item) => item["@type"] === "BreadcrumbList").itemListElement.at(-1).item, page.url);
  assert.ok(!schema.some((item) => item["@type"] === "Brand" || item["@type"] === "Review"), "no unverified brand or review assertions");
  assert.ok(page.mainEntity?.["@type"] !== "Brand", "demo profiles do not assert verified brand identity");
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "unique HTML IDs");
  for (const match of body.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), `anchor ${match[1]} exists`);
  for (const match of body.matchAll(/href="(\/(?:projects|brands|blog|shop)\/[^"?#]+)"/g)) {
    // Category pages render on request; product and editorial details are static.
    const isCategory = /^\/shop\/[^/]+$/.test(match[1]);
    assert.ok(manifest.routes[match[1]] || (isCategory && routes.dynamicRoutes.some((route) => new RegExp(route.regex).test(match[1]))), `linked route ${match[1]} is built`);
  }
  return page;
}

for (const kind of ["projects", "brands"]) {
  const indexHtml = await readBuild(`server/app/${kind}.html`);
  const collection = graph(indexHtml).find((item) => item["@type"] === "CollectionPage");
  const paths = collection.mainEntity.itemListElement.map((item) => new URL(item.url).pathname);
  allPaths.push(`/${kind}`, ...paths);
  test(`/${kind}: static directory, crawlable links, safe demo indexing`, () => {
    checkPage(indexHtml, `/${kind}`, "CollectionPage");
    assert.equal(paths.length, kind === "projects" ? 3 : 6);
    assert.equal(collection.mainEntity.numberOfItems, paths.length);
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(home.includes(`href="/${kind}"`), "homepage links to directory");
    for (const path of paths) assert.ok(visible(indexHtml).includes(`href="${path}"`));
  });
  for (const path of paths) {
    test(`${path}: meaningful server content, metadata, valid navigation`, async () => {
      const html = await readBuild(`server/app${path}.html`);
      checkPage(html, path, "WebPage");
      const body = visible(html);
      assert.ok(body.replace(/<[^>]+>/g, " ").split(/\s+/).length > 250, "detail content is rendered without JavaScript");
      assert.ok(body.includes("/contact"));
      assert.ok(body.includes('href="/shop"'), "detail links to the current catalog");
      if (kind === "projects") assert.match(body, /حضور آن‌ها در تصاویر/);
    });
  }
}

test("demo product references do not link to retired fixture detail routes", async () => {
  for (const path of ["projects/a-welcoming-lobby", "brands/noma"]) {
    const html = visible(await readBuild(`server/app/${path}.html`));
    assert.doesNotMatch(html, /href="\/shop\/[^"?#]+\/[^"?#]+"/);
    assert.ok(html.includes('href="/shop"'));
  }
});

if (process.env.SHOWCASE_TEST_URL) {
  const origin = process.env.SHOWCASE_TEST_URL;
  test("HTTP: static public pages, crawler noindex, localized missing routes", async () => {
    for (const path of allPaths) {
      const response = await fetch(new URL(path, origin), { redirect: "manual" });
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get("set-cookie"), null);
      assert.equal(response.headers.get("x-nextjs-cache"), "HIT");
    }
    for (const kind of ["projects", "brands"]) {
      for (const userAgent of ["Googlebot", "OAI-SearchBot", "bingbot"]) {
        const response = await fetch(new URL(`/${kind}`, origin), { headers: { "user-agent": userAgent } });
        assert.equal(response.status, 200);
        assert.match(meta(await response.text(), "robots"), /noindex, follow/);
      }
      const missing = await fetch(new URL(`/${kind}/not-a-real-record`, origin), { redirect: "manual" });
      assert.equal(missing.status, 404);
      const html = await missing.text();
      assert.match(meta(html, "robots"), /noindex/);
      assert.ok(visible(html).includes("این صفحه پیدا نشد."), "Persian recovery exists without JavaScript");
      assert.ok(visible(html).includes(`href="/${kind}"`), "404 offers the correct directory link");
    }
  });
}
