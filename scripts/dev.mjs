import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? 'all';

if (!['all', 'api', 'web'].includes(mode)) {
  console.error('Usage: pnpm dev[:api|:web]');
  process.exit(1);
}

const runApi = mode !== 'web';
const runWeb = mode !== 'api';
const webPort = runWeb ? await findAvailablePort(3000, 3020) : undefined;
const webHost = mode === 'all' ? '127.0.0.1' : 'localhost';
const apiEnvironment = { ...process.env };
const webEnvironment = { ...process.env };

if (webPort !== undefined) {
  webEnvironment.PORT = String(webPort);
  if (mode === 'all') apiEnvironment.WEB_ORIGIN = `http://127.0.0.1:${webPort}`;
}

const children = [];
let stopping = false;
let exitCode = 0;

if (runApi) {
  children.push(spawn(
    process.execPath,
    [resolve(root, 'apps/api/node_modules/@nestjs/cli/bin/nest.js'), 'start', '--watch'],
    { cwd: resolve(root, 'apps/api'), env: apiEnvironment, stdio: 'inherit' },
  ));
}

if (runWeb) {
  children.push(spawn(
    process.execPath,
    [resolve(root, 'apps/web/node_modules/next/dist/bin/next'), 'dev', '--hostname', webHost],
    { cwd: resolve(root, 'apps/web'), env: webEnvironment, stdio: 'inherit' },
  ));
  console.log(`Web: http://${webHost}:${webPort}`);
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32' && child.pid !== undefined) {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      killer.unref();
    } else {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

await Promise.all(children.map((child) => new Promise((resolveExit) => {
  child.once('error', (error) => {
    console.error(error.message);
    exitCode = 1;
    stop('SIGTERM');
    resolveExit();
  });
  child.once('exit', (code) => {
    if (!stopping && code !== 0) {
      exitCode = code ?? 1;
      stop('SIGTERM');
    }
    resolveExit();
  });
})));

process.exitCode = exitCode;

async function findAvailablePort(start, end) {
  for (let port = start; port <= end; port++) {
    const server = createServer();
    const available = await new Promise((resolveAvailable) => {
      server.once('error', () => resolveAvailable(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolveAvailable(true)));
    });
    if (available) return port;
  }
  throw new Error(`No free web port found between ${start} and ${end}`);
}
