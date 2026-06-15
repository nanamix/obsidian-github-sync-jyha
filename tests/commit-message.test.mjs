import assert from 'node:assert/strict';
import commitMessage from '../commit-message.js';

const { buildCommitMessage } = commitMessage;

function status(overrides = {}) {
	return {
		created: [],
		deleted: [],
		modified: [],
		not_added: [],
		renamed: [],
		files: [],
		...overrides,
	};
}

function firstLine(message) {
	return message.split('\n')[0];
}

assert.equal(
	firstLine(buildCommitMessage(status({ not_added: ['0000_JOURNAL/2026/06/new.md'] }))),
	'[ADD] 📝 노트 추가',
);

assert.equal(
	firstLine(buildCommitMessage(status({ deleted: ['old.md'] }))),
	'[REMOVE] 🔥 노트 삭제',
);

assert.equal(
	firstLine(buildCommitMessage(status({ renamed: [{ from: 'old.md', to: 'new.md' }] }))),
	'[RENAME] 🚚 노트 이름변경',
);

assert.equal(
	firstLine(buildCommitMessage(status({ modified: ['0000_JOURNAL/2026/06/today.md'] }))),
	'[DOCS] 📚 문서 수정',
);

assert.equal(
	firstLine(buildCommitMessage(status({ modified: ['main.ts'] }))),
	'[UPDATE] 🔄 vault 변경',
);

const mixed = buildCommitMessage(status({
	not_added: ['new.md'],
	modified: ['today.md'],
	deleted: ['old.md'],
}));

assert.equal(firstLine(mixed), '[UPDATE] 🔄 vault 동기화');
assert.match(mixed, /\n\n- 추가: 1개/);
assert.match(mixed, /\n- 수정: 1개/);
assert.match(mixed, /\n- 삭제: 1개/);

const withVaultNetwork = buildCommitMessage(
	status({ modified: ['0000_JOURNAL/2026/06/today.md'] }),
	{
		vaultName: 'medi-jyha-note',
		publicIp: '203.0.113.10',
		privateIps: ['192.168.0.10', '10.0.0.5'],
	},
);

assert.equal(firstLine(withVaultNetwork), '[DOCS] 📚 문서 수정');
assert.match(withVaultNetwork, /\n\n- Vault: medi-jyha-note/);
assert.match(withVaultNetwork, /\n- 공인IP: 203\.0\.113\.10/);
assert.match(withVaultNetwork, /\n- 사설IP: 192\.168\.0\.10, 10\.0\.0\.5/);

const explicitProfile = buildCommitMessage(
	status({ modified: ['0000_JOURNAL/2026/06/today.md'] }),
	{},
	{ profile: 'jyha-korean' },
);

assert.equal(firstLine(explicitProfile), '[DOCS] 📚 문서 수정');
assert.equal(
	firstLine(buildCommitMessage(status({ modified: ['0000_JOURNAL/2026/06/today.md'] }), {}, null)),
	'[DOCS] 📚 문서 수정',
);
assert.throws(
	() => buildCommitMessage(status({ modified: ['0000_JOURNAL/2026/06/today.md'] }), {}, { profile: 'missing' }),
	/Unknown commit message profile: missing/,
);

console.log('commit-message tests passed');
