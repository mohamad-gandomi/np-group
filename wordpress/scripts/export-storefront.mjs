import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

// One-time snapshot of the pre-CMS modules. The frontend never reads this archive.
const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (!path.extname(file)) file += '.ts';
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, process: { env: {} }, require: (specifier) => {
    if (specifier === 'server-only') return {};
    return load(specifier.startsWith('@/') ? `src/${specifier.slice(2)}` : path.resolve(path.dirname(file), specifier));
  } }, { filename: file });
  return exports;
}
const target = 'wordpress/fixtures/storefront.json';
if (existsSync(target)) throw new Error('Sample archive already exists; do not overwrite it.');
const catalog = load('src/features/catalog/catalog-data.ts');
const journal = load('src/features/journal/posts.ts');
const showcase = load('src/features/showcase/data.ts');
const details = load('src/features/product/product-details.ts');
const data = {
  categories: catalog.categories,
  products: catalog.products.map(product => ({ ...product, presentation: details.getProductPresentation(product) })),
  articles: journal.journalPosts, journalCategories: journal.journalCategories,
  brands: showcase.brands, projects: showcase.projects,
  sellerPhone: load('src/config/site.ts').siteConfig.phoneNumber,
};
mkdirSync('wordpress/fixtures', { recursive: true });
writeFileSync(target, JSON.stringify(data, null, 2) + '\n');
console.log(Object.fromEntries(Object.entries(data).filter(([,v]) => Array.isArray(v)).map(([k,v]) => [k,v.length])));
