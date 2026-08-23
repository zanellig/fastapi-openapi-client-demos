import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const initialSync = spawnSync(pnpm, ['api:sync'], { stdio: 'inherit' });
if (initialSync.status !== 0) {
  process.exit(initialSync.status ?? 1);
}

const children = [
  spawn(pnpm, ['api:watch'], { stdio: 'inherit' }),
  spawn(pnpm, ['codegen:watch'], { stdio: 'inherit' }),
  spawn(pnpm, ['dev:vite'], { stdio: 'inherit' }),
];
let stopping = false;

const stop = (signal) => {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill(signal);
    }
  }
};

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!stopping) {
      process.exitCode = code ?? (signal ? 1 : 0);
      stop('SIGTERM');
    }
  });
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
