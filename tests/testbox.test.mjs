import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.resolve(__dirname, '../scripts/testbox.mjs');

function run(args) {
	return spawnSync(process.execPath, [scriptPath, ...args], {
		encoding: 'utf8',
	});
}

const missingProfile = run(['--profile']);
assert.notEqual(missingProfile.status, 0);
assert.match(missingProfile.stderr, /testbox error: Missing value for --profile/);

const missingFixture = run(['--fixture']);
assert.notEqual(missingFixture.status, 0);
assert.match(missingFixture.stderr, /testbox error: Missing value for --fixture/);

const addedOnly = run(['--fixture', 'added-only']);
assert.equal(addedOnly.status, 0);
assert.match(addedOnly.stdout, /# Commit Message Testbox/);
assert.match(addedOnly.stdout, /profile: jyha-korean/);
assert.match(addedOnly.stdout, /## added-only/);
assert.match(addedOnly.stdout, /\[ADD\] 📝 노트 추가/);

console.log('testbox tests passed');
