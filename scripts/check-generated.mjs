// Fails when the OpenAPI snapshot or generated clients differ from the committed tree.
import { execFileSync } from 'node:child_process';

const paths = ['openapi', 'apps/hey-api/src/api/generated', 'apps/orval/src/api/generated'];
// Refresh stat data first so files rewritten with identical content are not reported.
// update-index exits non-zero when files really changed; the status call below reports them.
try {
  execFileSync('git', ['update-index', '-q', '--refresh'], { stdio: 'ignore' });
} catch {}
const status = execFileSync('git', ['status', '--porcelain', '--', ...paths], {
  encoding: 'utf8',
});
if (status.trim() !== '') {
  console.error('Generated artifacts are out of date. Commit these changes:\n' + status);
  process.exit(1);
}
console.log('OpenAPI snapshot and generated clients are up to date.');
