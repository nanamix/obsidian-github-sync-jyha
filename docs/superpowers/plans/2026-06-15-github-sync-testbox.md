# GitHub Sync Commit Convention Testbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI/fixture Testbox that previews commit messages for representative Git states without mutating Git history.

**Architecture:** Keep `commit-message.js` as the public core API while extracting convention text into profile modules. Add JSON fixtures and a `scripts/testbox.mjs` runner that loads fixtures, calls the same core builder, and prints human-readable previews.

**Tech Stack:** Node.js CommonJS/ESM mix already used by the repo, `node:assert/strict`, `node:fs/promises`, `node:path`, existing `npm test` workflow.

---

## File Structure

- Modify: `commit-message.js` — keep public API, add profile selection, keep backward compatibility.
- Create: `commit-profiles/jyha-korean.js` — default profile labels, emoji, summaries, and body labels.
- Modify: `tests/commit-message.test.mjs` — add tests for profiles, optional metadata, and mixed body lines.
- Create: `fixtures/added-only.json`
- Create: `fixtures/docs-only.json`
- Create: `fixtures/deleted-only.json`
- Create: `fixtures/renamed-only.json`
- Create: `fixtures/mixed-with-metadata.json`
- Create: `scripts/testbox.mjs` — fixture preview runner.
- Modify: `package.json` — add `testbox` script.
- Modify: `README.md` — document `npm run testbox`.

---

### Task 1: Extract the `jyha-korean` Profile

**Files:**
- Create: `commit-profiles/jyha-korean.js`
- Modify: `commit-message.js`
- Test: `tests/commit-message.test.mjs`

- [ ] **Step 1: Add a failing profile-selection test**

Append this test to `tests/commit-message.test.mjs` before the final `console.log` line:

```js
const explicitProfile = buildCommitMessage(
	status({ modified: ['0000_JOURNAL/2026/06/today.md'] }),
	{},
	{ profile: 'jyha-korean' },
);

assert.equal(firstLine(explicitProfile), '[DOCS] 📚 문서 수정');
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test
```

Expected: FAIL because `buildCommitMessage` ignores the third `options` argument or cannot resolve named profiles yet.

- [ ] **Step 3: Create the profile module**

Create `commit-profiles/jyha-korean.js`:

```js
const profile = {
	name: 'jyha-korean',
	types: {
		ADD: { emoji: '📝', summary: '노트 추가' },
		UPDATE: { emoji: '🔄', summary: 'vault 변경', mixedSummary: 'vault 동기화' },
		REMOVE: { emoji: '🔥', summary: '노트 삭제' },
		RENAME: { emoji: '🚚', summary: '노트 이름변경' },
		DOCS: { emoji: '📚', summary: '문서 수정' },
	},
	bodyLabels: {
		added: '추가',
		modified: '수정',
		deleted: '삭제',
		renamed: '이름변경',
		vaultName: 'Vault',
		publicIp: '공인IP',
		privateIps: '사설IP',
	},
};

module.exports = profile;
```

- [ ] **Step 4: Update `commit-message.js` to use profiles**

Replace the current `TYPE_LABELS` constant and related hard-coded label handling in `commit-message.js` with this complete structure:

```js
const jyhaKoreanProfile = require('./commit-profiles/jyha-korean');

const PROFILES = {
	[jyhaKoreanProfile.name]: jyhaKoreanProfile,
};

const DEFAULT_PROFILE = 'jyha-korean';
const DOC_EXTENSIONS = new Set(['.md', '.markdown', '.canvas']);

function resolveProfile(options = {}) {
	const profileName = options.profile || DEFAULT_PROFILE;
	const profile = PROFILES[profileName];
	if (!profile) {
		throw new Error(`Unknown commit message profile: ${profileName}`);
	}
	return profile;
}
```

Update `buildChangeLines` to accept `profile`:

```js
function buildChangeLines(status, profile) {
	const counts = countChanges(status);
	const lines = [];
	const labels = profile.bodyLabels;

	if (counts.added > 0) lines.push(`- ${labels.added}: ${counts.added}개`);
	if (counts.modified > 0) lines.push(`- ${labels.modified}: ${counts.modified}개`);
	if (counts.deleted > 0) lines.push(`- ${labels.deleted}: ${counts.deleted}개`);
	if (counts.renamed > 0) lines.push(`- ${labels.renamed}: ${counts.renamed}개`);

	return lines.length > 1 ? lines : [];
}
```

Update `buildMetadataLines`:

```js
function buildMetadataLines(metadata = {}, profile) {
	const lines = [];
	const labels = profile.bodyLabels;

	if (metadata.vaultName) lines.push(`- ${labels.vaultName}: ${metadata.vaultName}`);
	if (metadata.publicIp) lines.push(`- ${labels.publicIp}: ${metadata.publicIp}`);
	if (Array.isArray(metadata.privateIps) && metadata.privateIps.length > 0) {
		lines.push(`- ${labels.privateIps}: ${metadata.privateIps.join(', ')}`);
	}

	return lines;
}
```

Update `buildBody`:

```js
function buildBody(status, metadata, profile) {
	const lines = [
		...buildChangeLines(status, profile),
		...buildMetadataLines(metadata, profile),
	];

	return lines.length > 0 ? `\n\n${lines.join('\n')}` : '';
}
```

Update `buildCommitMessage`:

```js
function buildCommitMessage(status, metadata = {}, options = {}) {
	const profile = resolveProfile(options);
	const type = selectType(status);
	const label = profile.types[type];
	const hasMultipleChangeTypes = buildChangeLines(status, profile).length > 0;
	const summary = type === 'UPDATE' && hasMultipleChangeTypes && label.mixedSummary
		? label.mixedSummary
		: label.summary;

	return `[${type}] ${label.emoji} ${summary}${buildBody(status, metadata, profile)}`;
}
```

Update exports:

```js
module.exports = {
	buildCommitMessage,
	selectType,
	resolveProfile,
};
```

- [ ] **Step 5: Run tests to verify profile extraction**

Run:

```bash
npm test
```

Expected: PASS and output includes `commit-message tests passed`.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add commit-message.js commit-profiles/jyha-korean.js tests/commit-message.test.mjs
git commit -m "[UPDATE] 🔄 커밋 메시지 프로필 분리"
```

---

### Task 2: Add Fixture Files for the Testbox

**Files:**
- Create: `fixtures/added-only.json`
- Create: `fixtures/docs-only.json`
- Create: `fixtures/deleted-only.json`
- Create: `fixtures/renamed-only.json`
- Create: `fixtures/mixed-with-metadata.json`

- [ ] **Step 1: Create `fixtures/added-only.json`**

```json
{
  "name": "added-only",
  "description": "New Markdown note only",
  "status": {
    "created": [],
    "deleted": [],
    "modified": [],
    "not_added": ["0000_JOURNAL/2026/06/new-note.md"],
    "renamed": []
  },
  "metadata": {}
}
```

- [ ] **Step 2: Create `fixtures/docs-only.json`**

```json
{
  "name": "docs-only",
  "description": "Markdown and Canvas files modified",
  "status": {
    "created": [],
    "deleted": [],
    "modified": [
      "0000_JOURNAL/2026/06/today.md",
      "3000_AREAS/example.canvas"
    ],
    "not_added": [],
    "renamed": []
  },
  "metadata": {}
}
```

- [ ] **Step 3: Create `fixtures/deleted-only.json`**

```json
{
  "name": "deleted-only",
  "description": "Deleted note only",
  "status": {
    "created": [],
    "deleted": ["old-note.md"],
    "modified": [],
    "not_added": [],
    "renamed": []
  },
  "metadata": {}
}
```

- [ ] **Step 4: Create `fixtures/renamed-only.json`**

```json
{
  "name": "renamed-only",
  "description": "Renamed note only",
  "status": {
    "created": [],
    "deleted": [],
    "modified": [],
    "not_added": [],
    "renamed": [
      {
        "from": "old-name.md",
        "to": "new-name.md"
      }
    ]
  },
  "metadata": {}
}
```

- [ ] **Step 5: Create `fixtures/mixed-with-metadata.json`**

```json
{
  "name": "mixed-with-metadata",
  "description": "Mixed changes with vault and network metadata",
  "status": {
    "created": ["new.md"],
    "deleted": ["old.md"],
    "modified": ["today.md"],
    "not_added": [],
    "renamed": []
  },
  "metadata": {
    "vaultName": "example-vault",
    "publicIp": "203.0.113.10",
    "privateIps": ["192.168.0.10", "10.0.0.5"]
  }
}
```

- [ ] **Step 6: Validate fixture JSON**

Run:

```bash
node -e "const fs=require('fs'); for (const f of fs.readdirSync('fixtures')) JSON.parse(fs.readFileSync('fixtures/'+f,'utf8')); console.log('fixtures ok')"
```

Expected: `fixtures ok`.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add fixtures
git commit -m "[ADD] 📝 커밋 테스트박스 fixture 추가"
```

---

### Task 3: Add the CLI Testbox Runner

**Files:**
- Create: `scripts/testbox.mjs`
- Modify: `package.json`
- Test: `tests/commit-message.test.mjs`

- [ ] **Step 1: Add a fixture expectation test**

Append this block to `tests/commit-message.test.mjs` before `console.log`:

```js
const fixtureCases = [
	['added-only', '[ADD] 📝 노트 추가'],
	['docs-only', '[DOCS] 📚 문서 수정'],
	['deleted-only', '[REMOVE] 🔥 노트 삭제'],
	['renamed-only', '[RENAME] 🚚 노트 이름변경'],
	['mixed-with-metadata', '[UPDATE] 🔄 vault 동기화'],
];

for (const [fixtureName, expectedSubject] of fixtureCases) {
	const fixture = JSON.parse(
		await import('node:fs/promises').then((fs) =>
			fs.readFile(new URL(`../fixtures/${fixtureName}.json`, import.meta.url), 'utf8')
		),
	);
	assert.equal(firstLine(buildCommitMessage(fixture.status, fixture.metadata)), expectedSubject);
}
```

- [ ] **Step 2: Run tests to verify current core still passes fixtures**

Run:

```bash
npm test
```

Expected: PASS. If this fails, fix the fixture or profile behavior before adding the runner.

- [ ] **Step 3: Create `scripts/testbox.mjs`**

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import commitMessage from '../commit-message.js';

const { buildCommitMessage } = commitMessage;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const fixturesDir = path.join(repoRoot, 'fixtures');

function parseArgs(argv) {
	const args = {
		profile: 'jyha-korean',
		fixture: undefined,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const value = argv[i];
		if (value === '--profile') {
			args.profile = argv[i + 1];
			i += 1;
		} else if (value === '--fixture') {
			args.fixture = argv[i + 1];
			i += 1;
		} else {
			throw new Error(`Unknown argument: ${value}`);
		}
	}

	return args;
}

async function loadFixtures(selectedFixture) {
	const entries = await fs.readdir(fixturesDir);
	const jsonFiles = entries.filter((entry) => entry.endsWith('.json')).sort();
	const selected = selectedFixture
		? jsonFiles.filter((entry) => entry === `${selectedFixture}.json` || entry === selectedFixture)
		: jsonFiles;

	if (selected.length === 0) {
		throw new Error(`No fixture found for: ${selectedFixture}`);
	}

	return Promise.all(selected.map(async (entry) => {
		const filePath = path.join(fixturesDir, entry);
		const raw = await fs.readFile(filePath, 'utf8');
		return {
			file: entry,
			data: JSON.parse(raw),
		};
	}));
}

function printPreview(fixture, profile) {
	const message = buildCommitMessage(fixture.status, fixture.metadata || {}, { profile });
	const [subject, ...body] = message.split('\n');

	console.log(`## ${fixture.name}`);
	if (fixture.description) console.log(fixture.description);
	console.log('');
	console.log(subject);
	if (body.length > 0) {
		console.log(body.join('\n'));
	}
	console.log('');
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const fixtures = await loadFixtures(args.fixture);

	console.log(`# Commit Message Testbox`);
	console.log(`profile: ${args.profile}`);
	console.log('');

	for (const fixture of fixtures) {
		printPreview(fixture.data, args.profile);
	}
}

main().catch((error) => {
	console.error(`testbox error: ${error.message}`);
	process.exitCode = 1;
});
```

- [ ] **Step 4: Add `testbox` script to `package.json`**

Modify the `scripts` block:

```json
{
  "dev": "node esbuild.config.mjs",
  "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production",
  "test": "node tests/commit-message.test.mjs",
  "testbox": "node scripts/testbox.mjs",
  "version": "node version-bump.mjs && git add manifest.json versions.json"
}
```

- [ ] **Step 5: Run the Testbox**

Run:

```bash
npm run testbox
```

Expected output includes:

```text
# Commit Message Testbox
profile: jyha-korean

## added-only
New Markdown note only

[ADD] 📝 노트 추가
```

- [ ] **Step 6: Run a single fixture**

Run:

```bash
npm run testbox -- --fixture mixed-with-metadata
```

Expected output includes:

```text
[UPDATE] 🔄 vault 동기화

- 추가: 1개
- 수정: 1개
- 삭제: 1개
- Vault: example-vault
- 공인IP: 203.0.113.10
- 사설IP: 192.168.0.10, 10.0.0.5
```

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add package.json package-lock.json scripts/testbox.mjs tests/commit-message.test.mjs
git commit -m "[ADD] 🧪 커밋 메시지 테스트박스 추가"
```

---

### Task 4: Document the Testbox

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add README section**

Insert after the `Jyha fork` section:

```markdown
## Commit Message Testbox

This fork includes a local Testbox for previewing commit messages without committing anything.

Run all fixtures:

```bash
npm run testbox
```

Run one fixture:

```bash
npm run testbox -- --fixture mixed-with-metadata
```

The default profile is `jyha-korean`.

Testbox rules:

- It reads JSON fixtures from `fixtures/`.
- It calls the same `buildCommitMessage` core used by sync.
- It never stages, commits, pulls, or pushes.
- It is safe to run before changing a real vault.
```

- [ ] **Step 2: Run docs sanity check**

Run:

```bash
rg -n "npm run testbox|Commit Message Testbox|jyha-korean" README.md
```

Expected: all three strings are found.

- [ ] **Step 3: Commit Task 4**

Run:

```bash
git add README.md
git commit -m "[DOCS] 📝 커밋 테스트박스 사용법 추가"
```

---

### Task 5: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run tests**

Run:

```bash
npm test
```

Expected: `commit-message tests passed`.

- [ ] **Step 2: Run Testbox**

Run:

```bash
npm run testbox
```

Expected: previews for `added-only`, `deleted-only`, `docs-only`, `mixed-with-metadata`, and `renamed-only`.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript check passes and `main.js` is rebuilt.

- [ ] **Step 4: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 5: Inspect final status**

Run:

```bash
git status --short --branch
```

Expected: branch contains only intentional changes or is clean after the task commits.

- [ ] **Step 6: Commit build artifact if changed**

If `npm run build` changes `main.js`, run:

```bash
git add main.js
git commit -m "[UPDATE] 📦 테스트박스 빌드 산출물 갱신"
```

If `main.js` is unchanged, skip this step.
