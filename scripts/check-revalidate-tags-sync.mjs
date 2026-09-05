// Checks that every ISR tag literal passed to `isr(...)` across
// packages/service/src is registered in apps/web's `REVALIDATE_TAGS` map
// (apps/web/src/utils/revalidate-tags/revalidate-tags.ts) — the revalidation
// webhook's `_type` → tag lookup. A tag missing from that map's value union
// means a publish for that document type never purges it: the webhook has
// no per-tag Object.hasOwn miss to report, so this is the only guard against
// that failure class.
//
// A call is treated as `isr(...)` by its literal callee text, same as
// `extractRevalidateTagValues` matches `REVALIDATE_TAGS` by its declared
// name — this codebase has exactly one function named `isr`, and shadowing
// it is not a shape this script defends against. What *is* symbol-resolved,
// never name-matched, is what value that call's argument actually carries.
// A direct string/array-literal `isr(...)` argument is read straight off the
// AST. A bare identifier is resolved through a real TypeScript program and
// its `TypeChecker`, so it is traced to its *actual declaration by symbol* —
// never by matching an identifier or property name across files by text.
// Two shapes reach a literal this way:
//   - the identifier's own declaration is a variable (a local const, or one
//     reached through an import — the checker resolves the alias) whose
//     initializer is itself a literal;
//   - the identifier's declaration is a parameter (direct, or one level of
//     object-destructuring) of some enclosing factory function. Every call
//     of that *exact* declaration — found via the checker's own call-site
//     signature resolution, `checker.getResolvedSignature`, not by callee
//     name — is inspected for the corresponding argument. A rest parameter
//     collects every trailing argument, not just the first. A call site
//     whose alignment the checker can't trust (a spread argument) or whose
//     value doesn't reduce to a literal is reported as its own unresolved
//     entry — never silently merged away by a sibling call site that did
//     resolve.
// A `module:${id}` (or similarly substituted) template element is always
// classified as dynamic — a per-document tag `getRevalidateTagsForType`
// appends itself for any `module_*` type — never registrable.
//
// What this proves: every `isr(...)` tag argument this script accepts as
// covered is linked, symbol by symbol, to a literal — not merely present
// somewhere in the scanned files under a matching name. What it does not
// prove: coverage of a shape it doesn't recognize at all (a computed
// expression, a non-literal property value) — those are reported as
// unresolved and fail the run rather than being silently accepted.
//
// Run with `pnpm check:revalidate-tags-sync`. Read-only; exits 1 on any
// mismatch or unresolved call site.
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');

const REVALIDATE_TAGS_FILE = join(
  repoRoot,
  'apps/web/src/utils/revalidate-tags/revalidate-tags.ts',
);
const SERVICE_SRC_DIR = join(repoRoot, 'packages/service/src');
const SERVICE_TSCONFIG = join(repoRoot, 'packages/service/tsconfig.json');

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

export const listServiceSourceFiles = (
  dir = SERVICE_SRC_DIR,
  readdir = readdirSync,
) =>
  readdir(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .filter((entry) => !entry.name.endsWith('.test.ts'))
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name));

const isStringLike = (node) =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

/**
 * Every string literal found in a `REVALIDATE_TAGS`-shaped object literal's
 * array-valued properties (`{ key: ['tag', ...], ... }`), regardless of how
 * the object literal itself is wrapped (`as const satisfies ...`).
 */
export const extractRevalidateTagValues = (sf) => {
  const values = new Set();
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'REVALIDATE_TAGS' &&
      node.initializer
    ) {
      let objectLiteral = node.initializer;
      while (
        ts.isAsExpression(objectLiteral) ||
        ts.isSatisfiesExpression(objectLiteral)
      ) {
        objectLiteral = objectLiteral.expression;
      }
      if (ts.isObjectLiteralExpression(objectLiteral)) {
        for (const prop of objectLiteral.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            ts.isArrayLiteralExpression(prop.initializer)
          ) {
            for (const element of prop.initializer.elements) {
              if (isStringLike(element)) values.add(element.text);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return values;
};

// A relative-path formatter for reporting; keeps output stable across
// machines instead of leaking each contributor's absolute checkout path.
const toRelative = (file) => relative(repoRoot, file);

/**
 * Classifies every element of an argument list — an array literal's
 * elements, or a rest parameter's trailing call-site arguments — into
 * `target.tags` (plain strings), `target.dynamic` (substituted templates,
 * a per-document runtime tag) or `target.unresolved` (anything else).
 */
const classifyElements = (elements, sf, fileRel, target) => {
  for (const element of elements) {
    if (isStringLike(element)) {
      target.tags.add(element.text);
    } else if (ts.isTemplateExpression(element)) {
      target.dynamic.push({ file: fileRel, text: element.getText(sf) });
    } else {
      target.unresolved.push({ file: fileRel, text: element.getText(sf) });
    }
  }
};

/**
 * Classifies a single resolved value node the same way `classifyElements`
 * classifies one element — a literal, an array of them, a dynamic template,
 * or (anything else) unresolved.
 */
const classifyResolvedValue = (valueNode, fileRel, target) => {
  const sf = valueNode.getSourceFile();
  if (isStringLike(valueNode)) {
    target.tags.add(valueNode.text);
    return;
  }
  if (ts.isArrayLiteralExpression(valueNode)) {
    classifyElements(valueNode.elements, sf, fileRel, target);
    return;
  }
  if (ts.isTemplateExpression(valueNode)) {
    target.dynamic.push({ file: fileRel, text: valueNode.getText(sf) });
    return;
  }
  target.unresolved.push({ file: fileRel, text: valueNode.getText(sf) });
};

const readServiceCompilerOptions = () => {
  const configFile = ts.readConfigFile(SERVICE_TSCONFIG, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'),
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    dirname(SERVICE_TSCONFIG),
  );
  return parsed.options;
};

/**
 * Builds a full TypeScript program over `files` (the real filesystem, real
 * module resolution) so identifiers can be resolved to their actual
 * declarations by symbol, cross-file, the same way `tsc` itself would.
 */
export const createServiceProgram = (
  files,
  options = readServiceCompilerOptions(),
) => ts.createProgram({ rootNames: files, options });

const VIRTUAL_COMPILER_OPTIONS = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  noLib: true,
  skipLibCheck: true,
};

/**
 * Builds a full TypeScript program over an in-memory fixture map
 * (`{ '/virtual/file.ts': 'source text' }`) instead of the real filesystem,
 * so tests can exercise cross-file symbol resolution — including relative
 * `import`s between fixtures — without touching disk.
 */
export const createVirtualProgram = (
  fixtures,
  options = VIRTUAL_COMPILER_OPTIONS,
) => {
  const files = new Map(Object.entries(fixtures));
  const host = {
    getSourceFile: (fileName) => {
      const text = files.get(fileName);
      return text === undefined ? undefined : parseSource(fileName, text);
    },
    writeFile: () => {},
    getCurrentDirectory: () => '/virtual',
    getDirectories: () => [],
    fileExists: (fileName) => files.has(fileName),
    readFile: (fileName) => files.get(fileName),
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    getDefaultLibFileName: () => '/virtual/lib.d.ts',
    resolveModuleNames: (moduleNames, containingFile) =>
      moduleNames.map((moduleName) => {
        if (!moduleName.startsWith('.')) return undefined;
        const candidate = join(dirname(containingFile), `${moduleName}.ts`)
          .split('\\')
          .join('/');
        return files.has(candidate)
          ? { resolvedFileName: candidate, extension: ts.Extension.Ts }
          : undefined;
      }),
  };
  return ts.createProgram({ rootNames: [...files.keys()], options, host });
};

const findEnclosingFunctionLike = (node) => {
  let current = node.parent;
  while (current && !ts.isFunctionLike(current)) current = current.parent;
  return current ?? null;
};

const findAncestorParameter = (node) => {
  let current = node;
  while (current && !ts.isParameter(current)) current = current.parent;
  return current ?? null;
};

/**
 * Reduces a value-declaration (`ts.isParameter`/`ts.isBindingElement`) for a
 * bare identifier passed to `isr(...)` down to the shape needed to read the
 * same binding off a call site of the enclosing function: which positional
 * argument holds it, whether it's a rest parameter (every trailing argument
 * counts), and — for a destructured options-object parameter — which
 * property name to read off that argument. Returns `null` for a shape this
 * script does not trust itself to align correctly (e.g. destructuring
 * nested more than one level deep, or a rest element inside a nested
 * pattern), so the caller reports it as unresolved rather than guessing.
 */
const describeParamBinding = (declaration) => {
  const fn = findEnclosingFunctionLike(declaration);
  if (!fn) return null;

  if (ts.isParameter(declaration)) {
    return {
      fn,
      paramIndex: fn.parameters.indexOf(declaration),
      isRest: Boolean(declaration.dotDotDotToken),
      propName: null,
    };
  }

  if (
    ts.isBindingElement(declaration) &&
    !declaration.dotDotDotToken &&
    ts.isIdentifier(declaration.name)
  ) {
    const ancestorParam = findAncestorParameter(declaration);
    if (
      !ancestorParam ||
      !ts.isObjectBindingPattern(ancestorParam.name) ||
      declaration.parent !== ancestorParam.name
    ) {
      return null;
    }
    const propName =
      declaration.propertyName && ts.isIdentifier(declaration.propertyName)
        ? declaration.propertyName.text
        : declaration.name.text;
    return {
      fn,
      paramIndex: fn.parameters.indexOf(ancestorParam),
      isRest: false,
      propName,
    };
  }

  return null;
};

/**
 * Looks up `propName` on the checker's type of `objectArgument` — not by
 * walking object-literal syntax — so a call-site argument that is itself a
 * variable (not an inline literal) still resolves. Returns the property's
 * initializer expression, or `null` if the checker can't connect it to one.
 */
const resolvePropertyInitializer = (checker, objectArgument, propName) => {
  const type = checker.getTypeAtLocation(objectArgument);
  const propSymbol = type.getProperty(propName);
  const decl = propSymbol?.valueDeclaration;
  if (decl && ts.isPropertyAssignment(decl)) return decl.initializer;
  if (decl && ts.isShorthandPropertyAssignment(decl)) return decl.name;
  return null;
};

/**
 * Resolves one pending bare-identifier `isr(...)` argument against every
 * call site of its enclosing function the checker connects to that *exact*
 * declaration (`callSitesByDeclaration`, keyed by declaration node — never
 * by callee name). A factory with no such call site in the scanned files is
 * reported unresolved. Every call site that does exist is inspected
 * independently: one that resolves to a literal contributes tags, one whose
 * positional alignment the checker can't trust (a spread argument) or whose
 * value isn't a literal is reported as its own unresolved entry — a
 * resolved sibling call site never suppresses that report.
 */
const resolvePendingIdentifier = (
  checker,
  pending,
  callSitesByDeclaration,
  target,
) => {
  const { declaration, fileRel, text } = pending;
  const binding = describeParamBinding(declaration);
  if (!binding) {
    target.unresolved.push({ file: fileRel, text });
    return;
  }

  const sites = callSitesByDeclaration.get(binding.fn) ?? [];
  if (sites.length === 0) {
    target.unresolved.push({ file: fileRel, text });
    return;
  }

  for (const call of sites) {
    const callFileRel = toRelative(call.getSourceFile().fileName);
    const args = call.arguments;

    if (args.some((argNode) => ts.isSpreadElement(argNode))) {
      target.unresolved.push({ file: callFileRel, text: call.getText() });
      continue;
    }

    if (binding.isRest) {
      classifyElements(
        args.slice(binding.paramIndex),
        call.getSourceFile(),
        callFileRel,
        target,
      );
      continue;
    }

    const arg = args[binding.paramIndex];
    if (!arg) {
      target.unresolved.push({ file: callFileRel, text: call.getText() });
      continue;
    }

    let valueNode = arg;
    if (binding.propName !== null) {
      const resolved = resolvePropertyInitializer(
        checker,
        arg,
        binding.propName,
      );
      if (!resolved) {
        target.unresolved.push({ file: callFileRel, text: arg.getText() });
        continue;
      }
      valueNode = resolved;
    }

    classifyResolvedValue(valueNode, callFileRel, target);
  }
};

/**
 * Resolves a bare identifier's own declaration via the checker (unwrapping
 * an import alias first) to one of: a variable/import binding whose
 * initializer is classified directly, a parameter binding queued as
 * `pending` for cross-file call-site resolution, or (anything else)
 * unresolved.
 */
const resolveIdentifierArgument = (
  checker,
  arg,
  sf,
  fileRel,
  target,
  pending,
) => {
  let symbol = checker.getSymbolAtLocation(arg);
  if (symbol && (symbol.flags & ts.SymbolFlags.Alias) !== 0) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const declaration = symbol?.declarations?.[0];

  if (
    declaration &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer
  ) {
    classifyResolvedValue(declaration.initializer, fileRel, target);
    return;
  }
  if (
    declaration &&
    (ts.isParameter(declaration) || ts.isBindingElement(declaration))
  ) {
    pending.push({ declaration, fileRel, text: arg.getText(sf) });
    return;
  }
  target.unresolved.push({ file: fileRel, text: arg.getText(sf) });
};

/**
 * Walks every `isr(...)` call across the program's `files`, classifying its
 * tag argument, and resolves every bare-identifier argument found along the
 * way against the program's own symbols — never by callee or property name.
 * Returns `tags` (every argument connected to a literal), `dynamic`
 * (runtime-appended per-document template tags, correctly skipped) and
 * `unresolved` (any call this script could not connect to a literal).
 */
export const collectServiceTags = (program, files) => {
  const checker = program.getTypeChecker();
  const sourceFiles = files
    .map((file) => program.getSourceFile(file))
    .filter((sf) => sf !== undefined);

  const tags = new Set();
  const dynamic = [];
  const unresolved = [];
  const pending = [];
  const callSitesByDeclaration = new Map();

  for (const sf of sourceFiles) {
    const fileRel = toRelative(sf.fileName);

    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const declaration = checker.getResolvedSignature(node)?.declaration;
        if (declaration && ts.isFunctionLike(declaration)) {
          if (!callSitesByDeclaration.has(declaration)) {
            callSitesByDeclaration.set(declaration, []);
          }
          callSitesByDeclaration.get(declaration).push(node);
        }

        if (
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'isr' &&
          node.arguments[0]
        ) {
          const arg = node.arguments[0];
          const target = { tags, dynamic, unresolved };
          if (isStringLike(arg)) {
            tags.add(arg.text);
          } else if (ts.isArrayLiteralExpression(arg)) {
            classifyElements(arg.elements, sf, fileRel, target);
          } else if (ts.isIdentifier(arg)) {
            resolveIdentifierArgument(
              checker,
              arg,
              sf,
              fileRel,
              target,
              pending,
            );
          } else {
            unresolved.push({ file: fileRel, text: arg.getText(sf) });
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  for (const item of pending) {
    resolvePendingIdentifier(checker, item, callSitesByDeclaration, {
      tags,
      dynamic,
      unresolved,
    });
  }

  return { tags, dynamic, unresolved };
};

export const findMissingTags = (serviceTags, revalidateTagValues) =>
  [...serviceTags].filter((tag) => !revalidateTagValues.has(tag)).sort();

const formatReport = (missing, unresolved, revalidateTagsRelPath) => {
  const lines = [];
  if (missing.length) {
    lines.push(
      `REVALIDATE_TAGS (${revalidateTagsRelPath}) is missing an entry for tag(s) ` +
        `passed to isr(...) in packages/service/src: ${missing.join(', ')}`,
      '',
      'Add each tag to the matching entry in REVALIDATE_TAGS, or remove it from ' +
        'the loader if it was added by mistake.',
    );
  }
  if (unresolved.length) {
    if (lines.length) lines.push('');
    lines.push(
      'Found isr(...) call site(s) whose tag argument this script cannot ' +
        'statically resolve to a literal — fix the call to pass a string/array ' +
        'literal (or extend check-revalidate-tags-sync.mjs to handle the new shape):',
    );
    for (const { file, text } of unresolved) {
      lines.push(`  ${file}: ${text}`);
    }
  }
  return lines.join('\n');
};

const main = () => {
  const revalidateTagValues = extractRevalidateTagValues(
    parse(REVALIDATE_TAGS_FILE),
  );
  const files = listServiceSourceFiles();
  const program = createServiceProgram(files);
  const { tags, dynamic, unresolved } = collectServiceTags(program, files);
  const missing = findMissingTags(tags, revalidateTagValues);

  if (dynamic.length) {
    console.log(
      `Skipped ${dynamic.length} dynamic per-document tag(s) (e.g. ` +
        '`module:${id}`) — these are appended at runtime, not registered:',
    );
    for (const { file, text } of dynamic) {
      console.log(`  ${file}: ${text}`);
    }
  }

  if (missing.length || unresolved.length) {
    console.error(
      formatReport(
        missing,
        unresolved,
        relative(repoRoot, REVALIDATE_TAGS_FILE),
      ),
    );
    process.exit(1);
  }

  console.log(
    `REVALIDATE_TAGS covers every isr(...) tag literal found across ${files.length} ` +
      'packages/service/src file(s).',
  );
};

if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main();
}
