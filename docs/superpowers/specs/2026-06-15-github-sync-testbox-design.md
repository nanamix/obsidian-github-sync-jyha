# GitHub Sync Commit Convention Testbox Design

## 01. Context

`github-sync-jyha` is a personal fork of Obsidian GitHub Sync. The fork already separates commit message generation into `commit-message.js` and verifies the core behavior with `tests/commit-message.test.mjs`.

The current behavior is useful for one vault, but the same pattern can become generally useful if users can test a commit convention safely before enabling it for real sync commits.

## 02. Goal

Build a Testbox that lets users preview and verify generated commit messages without touching a real vault history.

The first implementation target is a developer-facing CLI and fixture testbox. The second target is an Obsidian settings UI preview based on the same core.

## 03. Non-Goals

- Do not redesign the full GitHub Sync workflow.
- Do not add branching support.
- Do not push, pull, or write commits from the Testbox.
- Do not make `jyha-korean` the only convention.
- Do not publish a separate public plugin in the first phase.

## 04. Recommended Approach

Use a two-phase design.

Phase 1: CLI and fixture Testbox

- Add JSON fixtures that mimic `simple-git` status output.
- Add a `testbox` runner that prints the generated subject and body for each fixture.
- Keep `npm test` as strict assertions.
- Add `npm run testbox` as human-readable preview.
- Introduce named convention profiles, starting with `jyha-korean`.

Phase 2: Obsidian UI preview

- Add a settings-tab section named `Commit Message Preview`.
- Show preview for the current vault status.
- Allow preview using built-in fixtures.
- Allow selecting a convention profile.
- Keep actual commit execution inside the existing sync command.

## 05. Architecture

### Core

`commit-message.js` remains the pure commit-message builder.

Planned split:

- `commit-message.js`: orchestration wrapper and exported public API
- `commit-profiles/jyha-korean.js`: labels, emojis, summary text, body labels
- `fixtures/*.json`: sample Git status inputs
- `tests/commit-message.test.mjs`: assertion tests
- `scripts/testbox.mjs`: fixture preview runner

### Public API

The core API should become:

```js
buildCommitMessage(status, metadata, options)
```

`options.profile` defaults to `jyha-korean`.

The first pass may keep backward compatibility:

```js
buildCommitMessage(status, metadata)
```

### Fixture Shape

Fixtures should be close to `simple-git` status objects:

```json
{
  "name": "mixed-vault-sync",
  "status": {
    "created": ["new.md"],
    "modified": ["today.md"],
    "deleted": ["old.md"],
    "renamed": []
  },
  "metadata": {
    "vaultName": "example-vault",
    "publicIp": "203.0.113.10",
    "privateIps": ["192.168.0.10"]
  }
}
```

## 06. Data Flow

CLI Testbox:

1. Read fixture files.
2. Select profile.
3. Call `buildCommitMessage`.
4. Print fixture name, subject, body, and expected category.
5. Exit non-zero only if fixture parsing fails.

Unit Tests:

1. Build status input in memory.
2. Call `buildCommitMessage`.
3. Assert exact subject and key body lines.

Obsidian UI Preview:

1. Read current git status with `simple-git`.
2. Build metadata using existing vault/IP helpers.
3. Call the same core builder.
4. Render read-only preview.
5. Do not stage, commit, pull, or push.

## 07. Error Handling

- Invalid fixture JSON: print file path and JSON parse error, then exit non-zero.
- Unknown profile: list available profiles and exit non-zero.
- Missing fixture directory: print setup guidance and exit non-zero.
- Public IP lookup failure in UI preview: omit public IP and continue.
- Git status failure in UI preview: show a warning notice and keep fixture preview available.

## 08. Testing

Phase 1 required tests:

- `npm test` passes existing exact-message assertions.
- Add assertions for profile selection.
- Add assertions that metadata is optional.
- Add assertions that non-document file modifications become `UPDATE`.
- Add assertions for mixed change body lines.
- `npm run testbox` prints previews for all fixtures.

Phase 2 required tests:

- UI preview calls the core builder without calling `git.add`, `git.commit`, `git.pull`, or `git.push`.
- Existing sync flow still commits with the selected profile.

## 09. Release Path

Phase 1 keeps the plugin private but makes the logic shareable.

Phase 2 can keep the `github-sync-jyha` plugin id for personal use.

A future public release should use a neutral plugin id such as `github-sync-convention-box`, with `jyha-korean` as one built-in profile rather than the product identity.

## 10. Acceptance Criteria

- A developer can run `npm run testbox` and see generated messages for representative Git states.
- The default profile reproduces the current jyha convention.
- The current plugin sync behavior is unchanged.
- Testbox never mutates Git history.
- The design allows additional profiles without editing the core classifier.
