# Security Policy

## Supported versions

The project is still pre-release. Security fixes are applied to the latest commit on `main`.

## Reporting a vulnerability

Do not open a public issue for a vulnerability or suspected credential exposure. Use GitHub's **Report a vulnerability** flow in the repository Security tab so the report remains private.

Include the affected version or commit, reproduction steps, impact, and any suggested mitigation. Reports are acknowledged as soon as maintainers are available.

## Credential handling

Never commit API keys, access tokens, passwords, private headers, or generated credential files. DSH Control Center stores supported secrets through the DSH credentials authority. The following invariant applies to every capability:

> Secret 不得进入普通设置响应、浏览器持久化、日志、导出、analytics 或 diagnostics

Test credentials must be local, synthetic, and scoped to disposable profiles. If a real credential is disclosed in an issue, log, commit, or chat, revoke or rotate it immediately; deleting the text is not sufficient because copies may persist.
