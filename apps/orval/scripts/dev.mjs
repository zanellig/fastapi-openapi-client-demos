import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';

// Since Node 18.20.2 / 20.12.2 (CVE-2024-27980), spawning a .cmd/.bat file
// without a shell throws EINVAL on Windows. pnpm is a .cmd shim there, so run
// it through the shell. Every command below is a fixed script name, never
// user input, so there is nothing to inject. The command is passed as one
// string because Node deprecates separate args with `shell: true` (DEP0190).
const describe = (script) => `pnpm ${script}`;
const run = (script, runner) =>
  isWindows
    ? runner(describe(script), { stdio: 'inherit', shell: true })
    : runner('pnpm', [script], { stdio: 'inherit' });

// Child exit codes can be negative or out of range on Windows (e.g. 4294967295).
const toExitCode = (code) =>
  Number.isInteger(code) && code > 0 && code < 256 ? code : 1;

const initialSync = run('api:sync', spawnSync);
if (initialSync.error) {
  console.error(
    `Could not start ${describe('api:sync')}: ${initialSync.error.message}`,
  );
  process.exit(1);
}
if (initialSync.status !== 0) {
  console.error(
    `${describe('api:sync')} failed (exit ${initialSync.status ?? initialSync.signal}). Is the backend running?`,
  );
  process.exit(toExitCode(initialSync.status));
}

const scripts = ['api:watch', 'codegen:watch', 'dev:vite'];
let stopping = false;

// With a shell on Windows, the direct child is cmd.exe; killing it alone would
// orphan pnpm, Node and Vite. taskkill /T ends the whole process tree.
const terminate = (child, signal) => {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) {
    return;
  }
  if (isWindows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  } else {
    child.kill(signal);
  }
};

const children = scripts.map((script) => {
  const child = run(script, spawn);
  child.on('error', (error) => {
    console.error(`Could not start ${describe(script)}: ${error.message}`);
    if (!stopping) {
      process.exitCode = 1;
      stop('SIGTERM');
    }
  });
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(
        `${describe(script)} exited (${code ?? signal}); stopping the other processes.`,
      );
      process.exitCode = toExitCode(code);
      stop('SIGTERM');
    }
  });
  return child;
});

function stop(signal) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    terminate(child, signal);
  }
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('exit', () => stop('SIGTERM'));
