// Fails when the OpenAPI snapshot or generated clients differ from the committed tree.
import { execFileSync } from 'node:child_process';

const paths = ['openapi', 'apps/hey-api/src/api/generated', 'apps/orval/src/api/generated'];
const status = execFileSync('git', ['status', '--porcelain', '--', ...paths], {
  encoding: 'utf8',
});
if (status.trim() !== '') {
  console.error('Generated artifacts are out of date. Commit these changes:\n' + status);
  process.exit(1);
}
console.log('OpenAPI snapshot and generated clients are up to date.');
