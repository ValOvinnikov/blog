// Checks that every `.optional()` env var across the apps' and packages'
// `env.ts` (`@t3-oss/env-nextjs`/`env-core` `createEnv({...})`) modules
// declares whether it is genuinely optional or merely optional *at boot* but
// required in a deployment environment — and, when run with an environment's
// context, that the required ones are actually provisioned there.
//
// Why the distinction needs declaring at all: `createEnv` validates eagerly at
// import time, and one env module is imported by every entry point, so marking
// a route-scoped secret required in the zod schema would turn one webhook's
// missing secret into a total outage. Optional-at-boot plus a loud guard at the
// point of use is the right pattern — but it leaves "required in production"
// stated nowhere a machine can check, which is what this script fixes.
//
// Each `.optional()` var carries exactly one marker comment directly above it:
//
//   // @env-required: development, production
//   // @env-optional
//
// An unmarked `.optional()` var is an error, so a newly added one cannot merge
// without someone deciding which it is. That is the whole point: a separate
// manifest would drift from the schema, the failure `check-turbo-env-sync.mjs`
// already exists to prevent.
//
// The script has two halves:
//
//   1. Classification coverage — source-only, needs no credentials, always
//      runs, always blocking.
//   2. Presence verification — runs only when an environment's context is
//      supplied, and is blocking or advisory per BLOCKING_ENVIRONMENTS.
//
// Presence arrives as one boolean per required var, `REQUIRED_ENV_PRESENT_<NAME>`,
// which the workflow computes with `${{ secrets.<NAME> != '' }}`. The
// comparison happens in GitHub's expression engine, so no secret value enters
// the runner at all — this process never holds one to begin with. Passing
// `toJSON(secrets)` instead would be simpler and would still let this script
// read names only, but it injects every secret into the runner's environment,
// which is a real (and zizmor-flagged) exposure for no benefit.
//
// The cost of that choice is a list of var names in the workflow, which could
// drift from the markers here. It cannot drift silently: a var marked required
// with no matching `REQUIRED_ENV_PRESENT_` input fails the run and names the
// line to add.
//
// Scope limit: presence is reported by a job scoped to a GitHub Environment,
// which holds the vars CI workflows consume plus the ones mirrored for deploy.
// A var read only by the running app is provisioned in the Vercel project and
// never appears there — so only vars provisioned in a GitHub Environment may be
// marked required today. See docs/context/environment-variables.md.
//
// Run with `pnpm check:required-env`. Read-only; exits 1 on any blocking
// failure.
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

export const ENVIRONMENT_VAR = 'REQUIRED_ENV_ENVIRONMENT';
export const PRESENCE_INPUT_PREFIX = 'REQUIRED_ENV_PRESENT_';

// The deployment environments a var may be marked required in. A marker
// naming anything else is an error rather than a silently ignored no-op.
export const KNOWN_ENVIRONMENTS = ['development', 'production'];

// Where a missing required var fails the run rather than warning. `production`
// is advisory while its known gaps are still open; moving it here is the last
// step of closing them.
export const BLOCKING_ENVIRONMENTS = new Set(['development']);

export const ENV_FILES = [
  'apps/web/src/utils/env/env.ts',
  'apps/platform/src/utils/env/env.ts',
  'packages/service/src/utils/env/env.ts',
  'packages/db/src/utils/env/env.ts',
  'packages/auth/src/utils/env/env.ts',
  'packages/auth/src/utils/oauth-env/oauth-env.ts',
  'packages/email/src/utils/env/env.ts',
].map((file) => join(repoRoot, file));

const MARKER_REQUIRED = 'required';
const MARKER_OPTIONAL = 'optional';

const MARKER_PATTERN = /^\/\/\s*@env-(required|optional)\s*(?::\s*(.*?)\s*)?$/;

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

// Reads the method names off the declaration's own call chain —
// `z.string().min(1).optional()` gives ['optional', 'min', 'string'] — rather
// than searching the whole initializer subtree, so a `.optional()` nested in an
// unrelated callback (`.refine((v) => v.optional())`) is never mistaken for one
// applied to the field itself.
//
// `null` means the schema is not an inline chain at all (a bare identifier
// aliasing a shared schema, say). Optionality cannot be read off the syntax
// then, and guessing "not optional" would let the var skip classification
// entirely — so callers report it instead.
export const readSchemaChain = (node) => {
  if (!ts.isCallExpression(node)) return null;

  const methods = [];
  let current = node;
  while (
    ts.isCallExpression(current) &&
    ts.isPropertyAccessExpression(current.expression)
  ) {
    methods.push(current.expression.name.text);
    current = current.expression.expression;
  }
  return methods;
};

const readMarker = (sf, node) => {
  const ranges = ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? [];
  const last = ranges.at(-1);
  if (!last) return null;

  const match = MARKER_PATTERN.exec(sf.text.slice(last.pos, last.end).trim());
  if (!match) return null;

  const environments = (match[2] ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return { kind: match[1], environments };
};

// Every `server`/`client` field declared under `createEnv({...})`, paired with
// whether its schema is `.optional()` and whatever marker sits above it.
export const extractDeclarations = (sf) => {
  const declarations = [];
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
          !ts.isPropertyAssignment(prop) ||
          (label !== 'server' && label !== 'client') ||
          !ts.isObjectLiteralExpression(prop.initializer)
        )
          continue;

        for (const field of prop.initializer.properties) {
          if (!ts.isPropertyAssignment(field)) continue;
          const name = field.name;
          if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) continue;

          const chain = readSchemaChain(field.initializer);
          declarations.push({
            name: name.text,
            isOptional: chain === null ? null : chain.includes('optional'),
            marker: readMarker(sf, field),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return declarations;
};

// Splits one file's declarations into the required-var list and the two kinds
// of source-level defect the coverage half reports.
export const classifyDeclarations = (declarations, file) => {
  const required = [];
  const optional = [];
  const unclassified = [];
  const invalid = [];

  for (const { name, isOptional, marker } of declarations) {
    if (isOptional === null) {
      invalid.push({
        name,
        file,
        reason:
          'schema is not an inline `z.…()` chain, so optionality cannot be read from it — inline the schema at the declaration',
      });
      continue;
    }

    if (!isOptional) {
      if (marker)
        invalid.push({
          name,
          file,
          reason: `carries an @env-${marker.kind} marker but is not \`.optional()\``,
        });
      continue;
    }

    if (!marker) {
      unclassified.push({ name, file });
      continue;
    }

    if (marker.kind === MARKER_OPTIONAL) {
      if (marker.environments.length)
        invalid.push({
          name,
          file,
          reason: '@env-optional takes no environment list',
        });
      else optional.push({ name, file });
      continue;
    }

    if (marker.kind !== MARKER_REQUIRED) continue;

    if (!marker.environments.length) {
      invalid.push({
        name,
        file,
        reason: '@env-required needs at least one environment',
      });
      continue;
    }

    const unknown = marker.environments.filter(
      (environment) => !KNOWN_ENVIRONMENTS.includes(environment),
    );
    if (unknown.length) {
      invalid.push({
        name,
        file,
        reason: `unknown environment(s): ${unknown.join(', ')}`,
      });
      continue;
    }

    required.push({ name, file, environments: marker.environments });
  }

  return { required, optional, unclassified, invalid };
};

export const collectClassification = (files, parseFn = (f) => parse(f)) => {
  const required = new Map();
  const optional = [];
  const unclassified = [];
  const invalid = [];

  for (const file of files) {
    const result = classifyDeclarations(
      extractDeclarations(parseFn(file)),
      file,
    );
    optional.push(...result.optional);
    unclassified.push(...result.unclassified);
    invalid.push(...result.invalid);

    for (const entry of result.required) {
      // The same var is declared in more than one module by design (a shared
      // secret both sides compare), so union the environments rather than
      // letting the last file win.
      const existing = required.get(entry.name);
      if (!existing) {
        required.set(entry.name, {
          environments: new Set(entry.environments),
          files: [entry.file],
        });
        continue;
      }
      for (const environment of entry.environments)
        existing.environments.add(environment);
      existing.files.push(entry.file);
    }
  }

  return { required, optional, unclassified, invalid };
};

// Reads the per-var booleans the workflow computed. Anything other than the
// literal 'true' counts as absent; an input that is not there at all is a
// wiring gap rather than a missing var, and is reported separately.
export const readPresence = (required, environment, processEnv) => {
  const absent = [];
  const unwired = [];

  for (const [name, entry] of required) {
    if (!entry.environments.has(environment)) continue;

    const input = processEnv[`${PRESENCE_INPUT_PREFIX}${name}`];
    if (input === undefined || input === '') unwired.push(name);
    else if (input !== 'true') absent.push(name);
  }

  return { absent: absent.sort(), unwired: unwired.sort() };
};

const relativeTo = (file) => relative(repoRoot, file);

const formatCoverageReport = ({ unclassified, invalid }) => {
  const lines = [];

  if (unclassified.length) {
    lines.push(
      'These `.optional()` env vars carry no classification marker:',
      ...unclassified.map(
        ({ name, file }) => `  ${name} — ${relativeTo(file)}`,
      ),
      '',
      'Add one of the following on the line directly above each declaration:',
      '  // @env-required: development, production   (a shipped feature is dead without it)',
      '  // @env-optional                            (off is a valid state for this environment)',
    );
  }

  if (invalid.length) {
    if (lines.length) lines.push('');
    lines.push(
      'These classification markers are malformed:',
      ...invalid.map(
        ({ name, file, reason }) =>
          `  ${name} — ${relativeTo(file)}: ${reason}`,
      ),
    );
  }

  return lines.join('\n');
};

const formatUnwiredReport = (unwired, environment) =>
  [
    `These vars are marked required in "${environment}" but the workflow reports no presence input for them:`,
    ...unwired.map((name) => `  ${name}`),
    '',
    'Add one line per var to the "Env vars classified, and required ones present" step in .github/workflows/ci.yml:',
    ...unwired.map(
      (name) =>
        `  ${PRESENCE_INPUT_PREFIX}${name}: \${{ secrets.${name} != '' }}   # or vars.${name} for a variable`,
    ),
  ].join('\n');

const main = () => {
  const classification = collectClassification(ENV_FILES);
  const { required, optional, unclassified, invalid } = classification;

  if (unclassified.length || invalid.length) {
    console.error(formatCoverageReport(classification));
    process.exit(1);
  }

  console.log(
    `Every \`.optional()\` env var is classified: ${required.size} required in at least one environment, ${optional.length} genuinely optional.`,
  );

  const environment = process.env[ENVIRONMENT_VAR];
  if (!environment) {
    console.log(
      `Presence verification skipped — no ${ENVIRONMENT_VAR} supplied. It runs in CI, where a job scoped to a GitHub Environment reports which of these vars that environment provides.`,
    );
    return;
  }

  if (!KNOWN_ENVIRONMENTS.includes(environment)) {
    console.error(
      `${ENVIRONMENT_VAR} is "${environment}", which is not one of: ${KNOWN_ENVIRONMENTS.join(', ')}.`,
    );
    process.exit(1);
  }

  const { absent, unwired } = readPresence(required, environment, process.env);

  // A wiring gap is always blocking: left advisory it would read as "nothing
  // missing" in exactly the environment nobody is watching.
  if (unwired.length) {
    console.error(formatUnwiredReport(unwired, environment));
    process.exit(1);
  }

  if (!absent.length) {
    console.log(
      `The "${environment}" environment provides every var marked required for it.`,
    );
    return;
  }

  const report = [
    `The "${environment}" environment is missing ${absent.length} var(s) marked required for it:`,
    ...absent.map((name) => `  ${name}`),
    '',
    'Each is declared `.optional()` so the app still boots, but the feature it gates is dead in that environment.',
  ].join('\n');

  if (BLOCKING_ENVIRONMENTS.has(environment)) {
    console.error(report);
    process.exit(1);
  }

  console.warn(
    `${report}\n\nAdvisory only — "${environment}" is not in BLOCKING_ENVIRONMENTS, so this does not fail the run.`,
  );
};

// Only run when invoked as a script — the fixture tests import this module.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
