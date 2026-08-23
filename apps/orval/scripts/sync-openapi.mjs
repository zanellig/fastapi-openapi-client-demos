import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const sourceUrl =
  process.env.OPENAPI_URL ?? 'http://127.0.0.1:8010/openapi.json';
const outputPath = path.resolve('openapi/openapi.json');
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

  const normalized = `${JSON.stringify(specification, null, 2)}\n`;
  if ((await readCurrent()) === normalized) {
    return false;
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, normalized, 'utf8');
  console.log('OpenAPI contract updated');
  return true;
};

const run = async () => {
  await syncOpenApi();
  if (!shouldWatch) {
    return;
  }

  console.log(`Watching ${sourceUrl} every ${intervalMs}ms`);
  setInterval(() => {
    syncOpenApi().catch((error) => {
      console.error(error instanceof Error ? error.message : error);
    });
  }, intervalMs);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
