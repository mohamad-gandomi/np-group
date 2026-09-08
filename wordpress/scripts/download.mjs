import { existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Download on the host: Docker's network may not share the host's proxy/VPN. */
export function downloadPackages() {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  const version = env.match(/^WOOCOMMERCE_VERSION=([\d.]+)\s*$/m)?.[1];
  if (!version) throw new Error('Set WOOCOMMERCE_VERSION in wordpress/.env.');
  const directory = new URL('../.cache/', import.meta.url);
  mkdirSync(directory, { recursive: true });
  const packages = [
    [`woocommerce-${version}.zip`, `plugin/woocommerce.${version}.zip`],
    ['wordpress-7.1-fa_IR.zip', 'translation/core/7.1/fa_IR.zip'],
    [`woocommerce-${version}-fa_IR.zip`, `translation/plugin/woocommerce/${version}/fa_IR.zip`],
  ];
  for (const [name, remote] of packages) {
    const target = fileURLToPath(new URL(name, directory));
    if (existsSync(target)) continue;
    console.log(`Downloading ${name} from WordPress.org…`);
    const result = spawnSync(process.platform === 'win32' ? 'curl.exe' : 'curl', [
      '--fail', '--location', '--silent', '--show-error', '--retry', '2', '--max-time', '180',
      '--output', `${target}.part`, `https://downloads.wordpress.org/${remote}`,
    ], { stdio: 'inherit', shell: false });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Download failed: ${name}. Check your internet connection and retry setup.`);
    renameSync(`${target}.part`, target);
  }
}
