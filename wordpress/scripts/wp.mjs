import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { downloadPackages } from './download.mjs';

const directory = fileURLToPath(new URL('..', import.meta.url));
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
const action = process.argv[2];
const password = () => randomBytes(24).toString('hex');

if (action === 'setup' && !existsSync(envPath)) {
  const template = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  writeFileSync(envPath, template.replaceAll('change-me', password), { flag: 'wx', mode: 0o600 });
  console.log('Created wordpress/.env with local credentials. Keep this file private.');
}
if (!existsSync(envPath)) throw new Error('Run npm run wp:setup first.');

function compose(...args) {
  const result = spawnSync('docker', ['compose', '--env-file', envPath, ...args], {
    cwd: directory, stdio: 'inherit', shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

switch (action) {
  case 'setup':
    downloadPackages();
    compose('up', '-d', '--wait', 'wordpress');
    compose('run', '--rm', '--entrypoint', 'sh', 'cli', '/workspace/scripts/setup.sh');
    break;
  case 'start': compose('up', '-d', '--wait', 'wordpress'); break;
  case 'stop': compose('stop'); break;
  case 'status': compose('ps'); break;
  case 'logs': compose('logs', '--tail=80', 'wordpress'); break;
  case 'cli': compose('run', '--rm', 'cli', ...process.argv.slice(3)); break;
  case 'test':
    compose('run', '--rm', '--entrypoint', 'php', 'cli', '/workspace/tests/lint.php');
    compose('run', '--rm', 'cli', 'eval-file', '/workspace/tests/products.php');
    break;
  case 'seed': compose('run', '--rm', 'cli', 'eval-file', '/workspace/scripts/seed.php'); break;
  default: throw new Error('Use setup, start, stop, status, logs, cli, test or seed.');
}
