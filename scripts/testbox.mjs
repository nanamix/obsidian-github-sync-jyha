import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import commitMessage from '../commit-message.js';

const { buildCommitMessage } = commitMessage;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const fixturesDir = path.join(repoRoot, 'fixtures');

function readFlagValue(argv, index, flagName) {
	const value = argv[index + 1];
	if (!value || value.startsWith('--')) {
		throw new Error(`Missing value for ${flagName}`);
	}
	return value;
}

function parseArgs(argv) {
	const args = {
		profile: 'jyha-korean',
		fixture: undefined,
	};

	for (let i = 0; i < argv.length; i += 1) {
		const value = argv[i];
		if (value === '--profile') {
			args.profile = readFlagValue(argv, i, '--profile');
			i += 1;
		} else if (value === '--fixture') {
			args.fixture = readFlagValue(argv, i, '--fixture');
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
