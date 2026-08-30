# Vendored DSH 0.1.2 contract tarballs

The npm registry does not carry DSH prereleases (`next` tag stays on
0.1.1-rc.2), so the contract packages this plugin builds against are vendored
here as tarballs and wired through `pnpm-workspace.yaml` overrides.

## Provenance

- Source: `deepseek-harness` @ `cd5ef81481` (v0.1.2-alpha.1), master.
- Version label: `0.1.2` (the harness baseline packer requires a stable
  X.Y.Z; the label is private to this repo — `file:` specs bypass the
  registry entirely).
- Built: 2026-08-30, via the harness workspace's own build + `pnpm -r pack`
  recipe (equivalent to `scripts/publish-npm-baseline.ts pack`, which itself
  cannot run on Windows because it spawns `pnpm` without a shell).
- Contents: 258 tarballs — every `packages/**`, `vendor/**`, `apps/**`
  workspace package, including `@deepseek-ai/cordis` and
  `@deepseek-ai/schemastery`, so the whole graph shares single instances.

## Regenerate

```sh
cd D:\Github_Open\deepseek-harness
git worktree add .worktrees/npm-baseline -b npm-baseline-0.1.2 <commit>
cd .worktrees/npm-baseline
# stabilize every package.json "version" key to 0.1.2 (packer requirement)
find . -name package.json -not -path '*/node_modules/*' \
  -exec sed -i '0,/"version": "[^"]*"/s//"version": "0.1.2"/' {} +
pnpm install --frozen-lockfile && pnpm run build
pnpm --filter './vendor/**' --filter './packages/**' --filter './apps/**' \
  --recursive pack --pack-destination <repo>/vendor/dsh-<ver>/
```

Then update the version references with `scripts/migrate-dsh-0.1.2.mjs`
(adjust the version constant) and `pnpm install`.
