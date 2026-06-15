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
