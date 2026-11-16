import { randomBytes } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const sourceUrl =
  process.env.OPENAPI_URL ?? 'http://127.0.0.1:8010/openapi.json';
// The committed snapshot at the repository root, resolved from this file so
// the script works from any working directory.
const outputPath = fileURLToPath(
  new URL('../../../openapi/openapi.json', import.meta.url),
);
const shouldWatch = process.argv.includes('--watch');
const intervalMs = 1_500;

const isObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readCurrent = async () => {
  try {
    return await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

// Write beside the target and rename over it, so Orval's watcher and readers
// never see a half-written file.
const writeAtomically = async (filePath, contents) => {
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`,
  );
  try {
    await writeFile(tempPath, contents, 'utf8');
    await rename(tempPath, filePath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
};

const syncOpenApi = async () => {
  const response = await fetch(sourceUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`OpenAPI request failed with status ${response.status}`);
  }

  const text = await response.text();
  let specification;
  try {
    specification = JSON.parse(text);
  } catch (error) {
    throw new Error('OpenAPI response was not valid JSON', { cause: error });
  }
  if (
    !isObject(specification) ||
    typeof specification.openapi !== 'string' ||
    !isObject(specification.paths)
  ) {
    throw new Error('OpenAPI response is missing its version or paths');
  }

  // Byte-identical to backend/scripts/export_openapi.py:
  // json.dumps(doc, indent=2, ensure_ascii=False) + "\n".
  const normalized = `${JSON.stringify(specification, null, 2)}\n`;
  if ((await readCurrent()) === normalized) {
    return false;
  }
  await writeAtomically(outputPath, normalized);
  console.log(`OpenAPI contract updated (${outputPath})`);
  return true;
};

const reportError = (error) => {
  console.error(error instanceof Error ? error.message : error);
};

const run = async () => {
  if (!(await syncOpenApi())) {
    console.log(`OpenAPI contract unchanged (${outputPath})`);
  }
  if (!shouldWatch) {
    return;
  }

  console.log(`Watching ${sourceUrl} every ${intervalMs}ms`);
  // Sequential polling: the next request starts only after the previous one
  // finished, so a slow response can never overlap another write.
  for (;;) {
    await delay(intervalMs);
    try {
      await syncOpenApi();
    } catch (error) {
      reportError(error);
    }
  }
};

run().catch((error) => {
  reportError(error);
  process.exitCode = 1;
});
