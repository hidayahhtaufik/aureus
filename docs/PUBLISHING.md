# Publishing `@auranode/x402-arc` to npm

The shared SDK at `packages/x402-arc/` is published to the public npm
registry under the `@auranode` scope. This guide covers a one-time setup
and the per-release flow.

## One-time setup

### 1. Create the npm org

If `@auranode` doesn't yet exist on npm:

1. Sign in at <https://www.npmjs.com>
2. Create org named `auranode` (Free plan is fine for public packages)
3. Verify your email

### 2. Login from your dev machine

```bash
npm login
# Username: your npm handle
# Password: ***
# Email: hello@auranode.xyz
# OTP: from your authenticator
```

Verify:

```bash
npm whoami     # should print your username
npm org ls auranode --json   # should list your username as a member
```

### 3. Confirm the package.json is publish-ready

`packages/x402-arc/package.json` should have:

- `"name": "@auranode/x402-arc"`
- `"version": "0.1.0"` (bump per release)
- `"main": "./dist/index.js"` (not `./src/*.ts`)
- `"types": "./dist/index.d.ts"`
- `"exports"` pointing at `./dist/*`
- `"files": ["dist/**/*", "README.md", "LICENSE"]`
- `"publishConfig": { "access": "public" }` (so a scoped package goes public, not the default private)
- `"prepublishOnly": "npm run clean && npm run build"`

(All of the above are already set on master.)

## Per-release flow

### 1. Bump version

Pick a semver bump from the repo root:

```bash
cd packages/x402-arc

# Patch:  0.1.0 → 0.1.1   (bug fixes only)
npm version patch

# Minor:  0.1.0 → 0.2.0   (new features, no breaking changes)
npm version minor

# Major:  0.1.0 → 1.0.0   (breaking)
npm version major
```

`npm version` writes the new number to `package.json` AND creates a git
commit + tag. Don't push the tag yet.

### 2. Build + dry-run publish

```bash
npm run clean
npm run build
npm publish --dry-run
```

Read the file list npm shows. Confirm:

- `dist/index.js`, `dist/index.d.ts`, `dist/client/*`, `dist/server/*` are present
- `src/` is NOT present (we removed it from `files`)
- README.md + LICENSE are present
- No `.env*`, no test files, no `node_modules`

If something unwanted is included, add it to `.npmignore` or refine the
`"files"` array.

### 3. Publish for real

```bash
npm publish
```

First publish of a scope: npm will say "publishing scoped package as public" — that's the `publishConfig.access: public` doing its job.

### 4. Verify the live package

```bash
npm view @auranode/x402-arc
npm view @auranode/x402-arc dist-tags
```

Expected: version matches what you just published. Try a fresh install in a sandbox to make sure exports resolve:

```bash
cd /tmp && mkdir x402-test && cd x402-test
npm init -y
npm install @auranode/x402-arc
node -e "import('@auranode/x402-arc').then(m => console.log(Object.keys(m)))"
```

### 5. Push the git tag

```bash
cd /var/www/aureus     # or wherever your local clone lives
git push origin master
git push origin v0.1.0
```

### 6. Create the GitHub release

```bash
gh release create v0.1.0 \
  --title "v0.1.0 — @auranode/x402-arc on npm" \
  --notes-from-tag
```

Or do it in the web UI: <https://github.com/hidayahhtaufik/aureus/releases/new>.

Body template:

```
## @auranode/x402-arc v0.1.0

First npm release of the x402-on-Arc SDK.

### What's in the package
- EIP-712 typed-data helpers
- EIP-3009 signer
- x402 payment-payload codec (base64 envelope)
- Express middleware factory (peer-dep)
- Arc Testnet constants (CAIP-2, USDC token, chain ID)

### Install

\`\`\`
npm install @auranode/x402-arc
\`\`\`

### Docs
https://aureus.auranode.xyz/docs

### Live facilitator
https://aureus.auranode.xyz
```

## Optional: also publish the facilitator

The facilitator (`facilitator/`) is intended to be self-hosted via
Docker, so it's normally NOT published to npm. If you want consumers to
run `npx @auranode/x402-arc-facilitator` directly:

1. Add `"bin": { "talos": "./dist/index.js" }` to its `package.json`
2. Repeat the same publish flow

For v0.1 we recommend keeping the facilitator unpublished — the Docker
image + deploy runbook is the canonical distribution path.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `npm publish` says "402 Payment Required" (ironic) | First scoped publish without `publishConfig.access: public` | Already set — but if it ever shows up, run `npm publish --access public` |
| `403 Forbidden` | npm thinks the name is taken or you're not in the org | Verify `npm whoami` + `npm org ls auranode` |
| Build outputs `.ts` instead of `.js` in `dist/` | `tsconfig.json` is missing `compilerOptions.outDir`/`emitDecoratorMetadata` | Check `packages/x402-arc/tsconfig.json` — should compile to `./dist` |
| Consumer gets "Cannot find module @auranode/x402-arc" | Package didn't publish, or `exports` map is wrong | `npm view @auranode/x402-arc` to confirm; inspect `package.json` exports |
| Need to unpublish a broken version | Can only unpublish within 72h | `npm unpublish @auranode/x402-arc@0.1.0` — then bump and publish a fix |
