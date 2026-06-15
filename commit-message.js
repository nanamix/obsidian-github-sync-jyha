const jyhaKoreanProfile = require('./commit-profiles/jyha-korean');

const PROFILES = {
	[jyhaKoreanProfile.name]: jyhaKoreanProfile,
};

const DEFAULT_PROFILE = 'jyha-korean';

const DOC_EXTENSIONS = new Set(['.md', '.markdown', '.canvas']);

function array(value) {
	return Array.isArray(value) ? value : [];
}

function getChangedPaths(status) {
	return [
		...array(status.not_added),
		...array(status.created),
		...array(status.modified),
		...array(status.deleted),
		...array(status.renamed).flatMap((entry) => [entry.from, entry.to].filter(Boolean)),
	];
}

function isDocPath(path) {
	const lower = String(path).toLowerCase();
	return [...DOC_EXTENSIONS].some((extension) => lower.endsWith(extension));
}

function countChanges(status) {
	return {
		added: array(status.not_added).length + array(status.created).length,
		modified: array(status.modified).length,
		deleted: array(status.deleted).length,
		renamed: array(status.renamed).length,
	};
}

function totalChanges(counts) {
	return counts.added + counts.modified + counts.deleted + counts.renamed;
}

function resolveProfile(options = {}) {
	const profileName = options?.profile || DEFAULT_PROFILE;
	const profile = PROFILES[profileName];
	if (!profile) {
		throw new Error(`Unknown commit message profile: ${profileName}`);
	}
	return profile;
}

function selectType(status) {
	const counts = countChanges(status);
	const total = totalChanges(counts);
	const changedPaths = getChangedPaths(status);

	if (total === counts.added && counts.added > 0) return 'ADD';
	if (total === counts.deleted && counts.deleted > 0) return 'REMOVE';
	if (total === counts.renamed && counts.renamed > 0) return 'RENAME';
	if (
		total === counts.modified &&
		counts.modified > 0 &&
		changedPaths.length > 0 &&
		changedPaths.every(isDocPath)
	) {
		return 'DOCS';
	}
	return 'UPDATE';
}

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

function buildBody(status, metadata, profile) {
	const lines = [
		...buildChangeLines(status, profile),
		...buildMetadataLines(metadata, profile),
	];

	return lines.length > 0 ? `\n\n${lines.join('\n')}` : '';
}

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

module.exports = {
	buildCommitMessage,
	selectType,
	resolveProfile,
};
