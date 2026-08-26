// Checks that every build-relevant env var declared across the apps' and
// their transitively-imported packages' `env.ts` (`@t3-oss/env-nextjs`/
// `env-core` `createEnv({...})` calls) is present in `turbo.json`'s `build`
// task `env` allowlist. Turbo strict env mode strips any var not in that
// list before running the build, so a var declared in an env.ts schema but
// missing here silently disappears at build time.
//
// Which env.ts files feed which app's declared-vars set is based on each
// app's actual package.json dependencies, not a guess: `apps/web` depends on
// `@blog/service` (Sanity), `@blog/db` and `@blog/auth` (Postgres/session);
// `apps/admin` depends on `@blog/db` and `@blog/auth` but never
// `@blog/service` (it never talks to Sanity). See APPS below.
//
// A var legitimately read only inside a runtime request/Server Action code
// path — one `next build`'s "collecting page data" phase never evaluates —
// belongs in RUNTIME_ONLY_EXCLUDED_VARS instead of turbo.json; see that
// constant for the bar to clear before adding one there.
//
// Run with `pnpm check:turbo-env-sync`. Read-only; exits 1 on any mismatch.
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const TURBO_JSON_FILE = join(repoRoot, 'turbo.json');

const WEB_ENV_FILE = join(repoRoot, 'apps/web/src/utils/env/env.ts');
const ADMIN_ENV_FILE = join(repoRoot, 'apps/admin/src/utils/env/env.ts');
const SERVICE_ENV_FILE = join(
  repoRoot,
  'packages/service/src/utils/env/env.ts',
);
const DB_ENV_FILE = join(repoRoot, 'packages/db/src/utils/env/env.ts');
const AUTH_ENV_FILE = join(repoRoot, 'packages/auth/src/utils/env/env.ts');

// Exported so the fixture tests can build a source file from an inline string
// instead of a file on disk.
export const parseSource = (file, text) =>
  ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  );

const parse = (file) => parseSource(file, readFileSync(file, 'utf8'));

// Every key declared under `createEnv({ server: {...}, client: {...} })`
// (env-nextjs) or `createEnv({ server: {...} })` (env-core) — both shapes
// share the same `server`/`client` object-literal structure.
export const extractEnvKeys = (sf) => {
  const keys = [];
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'createEnv' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      for (const prop of node.arguments[0].properties) {
        const label = prop.name?.getText(sf);
        if (
          ts.isPropertyAssignment(prop) &&
          (label === 'server' || label === 'client') &&
          ts.isObjectLiteralExpression(prop.initializer)
        ) {
          for (const field of prop.initializer.properties) {
            if (
              !ts.isPropertyAssignment(field) &&
              !ts.isShorthandPropertyAssignment(field)
            )
              continue;
            const name = field.name;
            if (ts.isIdentifier(name) || ts.isStringLiteral(name))
              keys.push(name.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return keys;
};

// Read only at request/runtime — a Server Action or route-handler body `next
// build`'s "collecting page data" phase never evaluates — and never touched
// by anything reachable during a build. Add a var here only when you can
// point at the specific runtime-only call site that proves it; the safe
// default for everything else is turbo.json's build env array, since being
// allow-listed there is harmless even for a build that never sets the var.
export const RUNTIME_ONLY_EXCLUDED_VARS = new Set([]);

export const APPS = [
  {
    label: 'web',
    files: [WEB_ENV_FILE, SERVICE_ENV_FILE, DB_ENV_FILE, AUTH_ENV_FILE],
  },
  { label: 'admin', files: [ADMIN_ENV_FILE, DB_ENV_FILE, AUTH_ENV_FILE] },
];

export const collectDeclaredVars = (files, parseFn = (f) => parse(f)) => {
  const declared = new Map();
  for (const file of files) {
    for (const key of extractEnvKeys(parseFn(file))) {
      if (!declared.has(key)) declared.set(key, file);
    }
  }
  return declared;
};

export const readTurboBuildEnv = (turboJsonText) => {
  const parsed = JSON.parse(turboJsonText);
  return new Set(parsed.tasks?.build?.env ?? []);
};

// Compares one app's declared vars (already excluded-filtered) against the
// turbo.json build env allowlist. Returns the sorted list of vars missing
// from the allowlist.
export const findMissingVars = (
  declared,
  turboBuildEnv,
  excluded = RUNTIME_ONLY_EXCLUDED_VARS,
) =>
  [...declared.keys()]
    .filter((key) => !excluded.has(key) && !turboBuildEnv.has(key))
    .sort();

const formatReport = (missingByApp, turboJsonRelPath) => {
  const lines = [
    "turbo.json's build env allowlist is missing declared build-time env vars:",
  ];
  for (const [label, missing] of Object.entries(missingByApp)) {
    lines.push(`  ${label} is missing: ${missing.join(', ')}`);
  }
  lines.push(
    '',
    `Add each var to the "build" task's "env" array in ${turboJsonRelPath}, or, if it is ` +
      'genuinely read only at request/runtime, add it to RUNTIME_ONLY_EXCLUDED_VARS in ' +
      'scripts/check-turbo-env-sync.mjs with a comment explaining why.',
  );
  return lines.join('\n');
};

const main = () => {
  const turboBuildEnv = readTurboBuildEnv(
    readFileSync(TURBO_JSON_FILE, 'utf8'),
  );

  const missingByApp = {};
  for (const { label, files } of APPS) {
    const declared = collectDeclaredVars(files);
    const missing = findMissingVars(declared, turboBuildEnv);
    if (missing.length) missingByApp[label] = missing;
  }

  if (Object.keys(missingByApp).length) {
    console.error(
      formatReport(missingByApp, relative(repoRoot, TURBO_JSON_FILE)),
    );
    process.exit(1);
  }

  console.log(
    "turbo.json's build env allowlist covers every declared build-time env var (web/admin).",
  );
};

// Only run when invoked as a script — the fixture tests import this module.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
