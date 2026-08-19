// Generates `packages/ui/COMPONENTS.md` — a compact index of every @blog/ui
// component (name, path, one-line purpose, declared props, variant options) so
// agents can answer "does a component like this already exist?" from one small
// read instead of scanning the whole component tree.
//
// GENERATED ARTIFACT — never hand-edit COMPONENTS.md; a hand-edit is overwritten
// on the next run and caught by `--check` in CI. Regenerate with `pnpm gen:ui-index`.
//
// Extraction uses the TypeScript compiler already in the repo (no extra dep) and
// reads each component's *declared* props straight from its `IXProps` interface,
// so inherited HTML-attribute props never bloat the output.
//
// Flags:
//   (none)        Regenerate and write COMPONENTS.md.
//   --check       Regenerate in memory; exit 1 if it differs from the committed
//                 file (CI drift guard). Writes nothing.
//   --check-descriptions
//                 Exit 1 listing any exported component/slot missing a JSDoc
//                 description (CI coverage guard). Writes nothing.
//   --check-structure
//                 Exit 1 if a component folder produced no entry or a compound
//                 slot didn't resolve — catches components the parser silently
//                 misses (CI completeness guard). Writes nothing.
//   --verify      All three guards in one parse (drift + structure +
//                 descriptions); exit 1 with a combined report. Writes nothing.
//                 This is what `pnpm gen:ui-index:check` runs in CI.
//   --if-staged   Only when staged files touch a ui component source: regenerate,
//                 `git add` the manifest, then run the structure + description
//                 guards and exit 1 (block the commit) if either fails. Fast
//                 no-op otherwise (the pre-commit path).
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, '..');
const uiRoot = join(repoRoot, 'packages/ui');
const uiSrc = join(uiRoot, 'src');
const outFile = join(uiRoot, 'COMPONENTS.md');
const LAYERS = ['atoms', 'molecules', 'organisms'];
const TYPE_MAX = 64; // truncate over-long prop type text to keep the manifest lean

const collapse = (s) => s.replace(/\s+/g, ' ').trim();

const toPascal = (dir) =>
  dir
    .split('-')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');

const parse = (file) =>
  ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

const isExported = (node) =>
  !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

// First sentence, not tripping on common abbreviations (e.g., i.e., etc.).
const ABBREV = ['e.g', 'i.e', 'etc', 'vs', 'cf', 'al'];
const firstSentence = (flat) => {
  const re = /[.!?](?=\s|$)/g;
  let m;
  while ((m = re.exec(flat))) {
    const before = flat.slice(0, m.index).toLowerCase();
    if (ABBREV.some((a) => before.endsWith(a))) continue;
    return flat.slice(0, m.index + 1);
  }
  return flat;
};

// A JSDoc doc-comment convention here is "Name — description"; the name is
// already in the heading/accessor, so drop that leading prefix.
const stripNamePrefix = (purpose, name) =>
  purpose.replace(new RegExp(`^${name}\\b\\s*[—–-]\\s*`), '');

// First sentence of a node's JSDoc, whitespace-collapsed.
const jsDocPurpose = (node) => {
  for (const doc of ts.getJSDocCommentsAndTags(node)) {
    if (!ts.isJSDoc(doc) || !doc.comment) continue;
    const text =
      typeof doc.comment === 'string'
        ? doc.comment
        : doc.comment.map((p) => p.text ?? '').join('');
    return firstSentence(collapse(text));
  }
  return '';
};

// The exported component declaration matching the folder's PascalCase name, plus
// its JSDoc (which, for `export const X = …`, lives on the statement).
const findComponent = (sf, name) => {
  let fallback = null;
  for (const stmt of sf.statements) {
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name) {
          const hit = { node: decl, purpose: jsDocPurpose(stmt) };
          if (isExported(stmt)) return hit;
          fallback ??= hit;
        }
      }
    }
    if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === name) {
      const hit = { node: stmt, purpose: jsDocPurpose(stmt) };
      if (isExported(stmt)) return hit;
      fallback ??= hit;
    }
  }
  return fallback;
};

// Prefer `I<Name>Props`, then `T<Name>Props`; else the first exported
// interface/type alias ending in "Props" (source order — only a fallback,
// since a file with multiple `*Props` declarations, e.g. a compound
// component's own props plus a nested slot-config props type, would
// otherwise pick whichever happens to be declared first).
const findPropsType = (sf, name) => {
  const preferredNames = [`I${name}Props`, `T${name}Props`];
  const candidates = [];
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) {
      const n = stmt.name.text;
      if (n.endsWith('Props')) candidates.push(stmt);
    }
  }
  for (const preferred of preferredNames) {
    const match = candidates.find((c) => c.name.text === preferred);
    if (match) return match;
  }
  return candidates[0] ?? null;
};

// A Level-2 polymorphic component's exported `I<Name>Props`/`T<Name>Props` is
// typically a bare `TPolymorphicProps<C, <Name>OwnProps>` reference (or an
// intersection of references) with no members of its own — the authored
// surface lives on the local `<Name>OwnProps` type it wraps. Resolves that
// sibling type by exact name so a caller can fall through to it instead of
// documenting an empty props list.
const findOwnPropsType = (sf, name) => {
  const ownNames = [`I${name}OwnProps`, `T${name}OwnProps`];
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) {
      if (ownNames.includes(stmt.name.text)) return stmt;
    }
  }
  return null;
};

const truncate = (s, max) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

// Walk a props type into its own property members and the named types it
// composes (interface `extends`, or the type-references in a `A & B & C` alias).
const collectType = (typeNode, sf, members, refs) => {
  if (ts.isTypeLiteralNode(typeNode)) {
    members.push(...typeNode.members);
  } else if (ts.isIntersectionTypeNode(typeNode)) {
    for (const sub of typeNode.types) collectType(sub, sf, members, refs);
  } else {
    refs.push(truncate(collapse(typeNode.getText(sf)), 48));
  }
};

const extractProps = (typeNode, sf) => {
  const members = [];
  const refs = [];
  if (ts.isInterfaceDeclaration(typeNode)) {
    members.push(...typeNode.members);
    for (const h of typeNode.heritageClauses ?? [])
      for (const t of h.types) refs.push(truncate(collapse(t.getText(sf)), 48));
  } else if (ts.isTypeAliasDeclaration(typeNode)) {
    collectType(typeNode.type, sf, members, refs);
  } else {
    // a raw TypeNode — an inline param annotation like `: ComponentProps<'div'>`
    collectType(typeNode, sf, members, refs);
  }

  const props = [];
  for (const m of members) {
    if (!ts.isPropertySignature(m) || !m.name) continue;
    const optional = m.questionToken ? '?' : '';
    const type = m.type ? truncate(collapse(m.type.getText(sf)), TYPE_MAX) : 'unknown';
    props.push(`${m.name.getText(sf)}${optional}: ${type}`);
  }
  return { props, extendsList: [...new Set(refs)] };
};

// Variant groups → option keys from a `tv({ variants: { … } })` call.
const extractVariants = (file, sf) => {
  let tvArg = null;
  const visit = (node) => {
    if (
      !tvArg &&
      ts.isCallExpression(node) &&
      node.expression.getText(sf) === 'tv' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      tvArg = node.arguments[0];
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!tvArg) return [];

  const variantsProp = tvArg.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      p.name.getText(sf) === 'variants' &&
      ts.isObjectLiteralExpression(p.initializer),
  );
  if (!variantsProp) return [];

  const groups = [];
  for (const group of variantsProp.initializer.properties) {
    if (
      !ts.isPropertyAssignment(group) ||
      !ts.isObjectLiteralExpression(group.initializer)
    )
      continue;
    const groupName = group.name.getText(sf);
    const keys = group.initializer.properties
      .map((opt) => opt.name?.getText(sf))
      .filter(Boolean)
      .map((k) => k.replace(/^\[|\]$/g, '').replace(/^['"]|['"]$/g, ''));
    if (keys.length === 0) continue;
    const isBoolean =
      keys.length <= 2 && keys.every((k) => k === 'true' || k === 'false');
    groups.push(`${groupName}: ${isBoolean ? '(boolean)' : keys.join('|')}`);
  }
  return groups;
};

// localName -> module specifier, for following a compound component's members
// back to the files that declare them.
const buildImportMap = (sf) => {
  const map = {};
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const bindings = stmt.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      const mod = stmt.moduleSpecifier.text;
      for (const el of bindings.elements) map[el.name.text] = mod;
    }
  }
  return map;
};

// Resolve a relative import, or a `@blog/ui[/subpath]` self-alias, to a source
// file. Prefers the eponymous `dir/dir-name.tsx` (the component file, with its
// props + JSDoc) over a barrel `index.ts`.
const resolveModule = (fromFile, spec) => {
  let base;
  if (spec.startsWith('.')) base = join(dirname(fromFile), spec);
  else if (spec === '@blog/ui') base = join(uiSrc, 'index');
  else if (spec.startsWith('@blog/ui/')) base = join(uiSrc, spec.slice('@blog/ui/'.length));
  else return null;

  return (
    [
      `${base}.tsx`,
      `${base}.ts`,
      join(base, `${basename(base)}.tsx`),
      join(base, `${basename(base)}.ts`),
      join(base, 'index.tsx'),
      join(base, 'index.ts'),
    ].find(existsSync) ?? null
  );
};

// Purpose + props + variants for one component `name` declared in `sf`/`file`.
// The type annotation on a component's first parameter, for components that
// type props inline (`({ … }: SomeType)`) instead of via a named `IXProps`.
const componentParamType = (node) => {
  let fn = null;
  if (
    node &&
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    fn = node.initializer;
  } else if (node && ts.isFunctionDeclaration(node)) {
    fn = node;
  }
  return fn?.parameters?.[0]?.type ?? null;
};

const describeComponent = (sf, file, name) => {
  const comp = findComponent(sf, name);
  const propsType = findPropsType(sf, name) ?? componentParamType(comp?.node);
  let { props, extendsList } = propsType
    ? extractProps(propsType, sf)
    : { props: [], extendsList: [] };

  // The chosen props type carried no members of its own — try the sibling
  // `<Name>OwnProps` type before giving up and documenting an empty list.
  if (props.length === 0) {
    const ownPropsType = findOwnPropsType(sf, name);
    if (ownPropsType) {
      const own = extractProps(ownPropsType, sf);
      if (own.props.length) ({ props, extendsList } = own);
    }
  }
  const variantsFile = file.replace(/\.tsx?$/, '-variants.ts');
  const variants = existsSync(variantsFile)
    ? extractVariants(variantsFile, parse(variantsFile))
    : [];
  const purpose = stripNamePrefix(comp?.purpose ?? '', name);
  return { node: comp?.node, purpose, props, extendsList, variants };
};

const unwrap = (expr) => {
  while (
    expr &&
    (ts.isSatisfiesExpression(expr) ||
      ts.isAsExpression(expr) ||
      ts.isParenthesizedExpression(expr))
  )
    expr = expr.expression;
  return expr;
};

// The object-literal initializer of a local `const name = { … }`, if any.
const findLocalObject = (sf, name) => {
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (
        ts.isIdentifier(decl.name) &&
        decl.name.text === name &&
        decl.initializer
      ) {
        const init = unwrap(decl.initializer);
        if (ts.isObjectLiteralExpression(init)) return init;
      }
    }
  }
  return null;
};

// Slot name -> referenced component identifier, resolving `...spread` of other
// local part objects. Dedupes by accessor, first occurrence wins.
const collectSlots = (obj, sf, seen = new Set()) => {
  const out = [];
  for (const prop of obj.properties) {
    if (ts.isShorthandPropertyAssignment(prop)) {
      out.push({ accessor: prop.name.text, ref: prop.name.text });
    } else if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.initializer)) {
      out.push({ accessor: prop.name.getText(sf), ref: prop.initializer.text });
    } else if (ts.isSpreadAssignment(prop) && ts.isIdentifier(prop.expression)) {
      const name = prop.expression.text;
      if (seen.has(name)) continue;
      seen.add(name);
      const nested = findLocalObject(sf, name);
      if (nested) out.push(...collectSlots(nested, sf, seen));
    }
  }
  const byAccessor = new Map();
  for (const s of out) if (!byAccessor.has(s.accessor)) byAccessor.set(s.accessor, s);
  return [...byAccessor.values()];
};

const describeSlots = (slots, imports, mainFile, name) =>
  slots.map(({ accessor, ref }) => {
    const resolved = imports[ref] ? resolveModule(mainFile, imports[ref]) : null;
    if (!resolved) {
      // Import couldn't be followed — the slot exists but the parser can't see
      // its source. Flag it so the completeness guard fails loudly.
      return {
        accessor: `${name}.${accessor}`,
        props: [],
        extendsList: [],
        variants: [],
        unresolved: true,
      };
    }
    return {
      accessor: `${name}.${accessor}`,
      ...describeComponent(parse(resolved), resolved, ref),
    };
  });

// Detects the two compound shapes in this library and resolves their members:
//   (a) `export const X = { Foo, Bar }`        -> { kind: 'members', list }
//   (b) `export const X = Object.assign(Root, Parts)` (slot compound)
//                                              -> { kind: 'slots', list, rootPurpose }
// Returns null for a plain component.
const describeCompound = (sf, mainFile, name, base) => {
  const init = base.node?.initializer ? unwrap(base.node.initializer) : null;
  if (!init) return null;
  const imports = buildImportMap(sf);

  if (ts.isObjectLiteralExpression(init)) {
    const list = describeSlots(collectSlots(init, sf), imports, mainFile, name);
    return list.length ? { kind: 'members', list } : null;
  }

  if (
    ts.isCallExpression(init) &&
    init.expression.getText(sf) === 'Object.assign'
  ) {
    const [rootArg, partsArg] = init.arguments;
    const rootPurpose =
      rootArg && ts.isIdentifier(rootArg)
        ? (findComponent(sf, rootArg.text)?.purpose ?? '')
        : '';
    let partsObj = null;
    if (partsArg && ts.isIdentifier(partsArg))
      partsObj = findLocalObject(sf, partsArg.text);
    else if (partsArg && ts.isObjectLiteralExpression(unwrap(partsArg)))
      partsObj = unwrap(partsArg);
    if (!partsObj) return null;
    const list = describeSlots(collectSlots(partsObj, sf), imports, mainFile, name);
    return list.length ? { kind: 'slots', list, rootPurpose } : null;
  }

  return null;
};

const mainFileFor = (dir, name) => {
  const canonical = join(dir, `${name}.tsx`);
  if (existsSync(canonical)) return canonical;
  const fallback = readdirSync(dir).find(
    (f) =>
      f.endsWith('.tsx') &&
      !f.endsWith('.stories.tsx') &&
      !f.endsWith('.test.tsx'),
  );
  return fallback ? join(dir, fallback) : null;
};

const collectLayer = (layer) => {
  const layerDir = join(uiSrc, layer);
  const entries = [];
  const skipped = [];
  if (!existsSync(layerDir)) return { entries, skipped };
  for (const dirName of readdirSync(layerDir).sort()) {
    const dir = join(layerDir, dirName);
    try {
      readdirSync(dir);
    } catch {
      continue; // not a directory
    }
    const name = toPascal(dirName);
    const mainFile = mainFileFor(dir, dirName);
    if (!mainFile) {
      skipped.push({
        dir: `${layer}/${dirName}`,
        reason: 'no component .tsx found',
      });
      continue;
    }

    try {
      const sf = parse(mainFile);
      const base = describeComponent(sf, mainFile, name);
      const compound = describeCompound(sf, mainFile, name, base);

      // 'members' compounds have no root, so drop the (misleading) root-level
      // props/variants; 'slots' compounds keep the root's own props/variants and
      // borrow the root's JSDoc purpose when the export itself carries none.
      const isMembers = compound?.kind === 'members';
      entries.push({
        name,
        path: relative(uiSrc, mainFile),
        purpose: stripNamePrefix(
          base.purpose || (compound?.kind === 'slots' ? compound.rootPurpose : ''),
          name,
        ),
        props: isMembers ? [] : base.props,
        extendsList: isMembers ? [] : base.extendsList,
        variants: isMembers ? [] : base.variants,
        members: isMembers ? compound.list : null,
        slots: compound?.kind === 'slots' ? compound.list : null,
      });
    } catch (err) {
      skipped.push({ dir: `${layer}/${dirName}`, reason: err.message });
    }
  }
  return { entries, skipped };
};

const propsFragment = (props, extendsList) => {
  const extend = extendsList.length ? `_(extends ${extendsList.join(', ')})_` : '';
  if (props.length) return `${props.join(' · ')}${extend ? ` ${extend}` : ''}`;
  return extend;
};

const renderSub = (s) => {
  const purpose = s.purpose ? `${s.purpose} ` : '';
  const props = propsFragment(s.props, s.extendsList) || '_none_';
  const variants = s.variants.length
    ? ` · Variants: ${s.variants.join(' · ')}`
    : '';
  return `- **${s.accessor}** — ${purpose}Props: ${props}${variants}`;
};

const renderEntry = (e) => {
  // Prettier's markdown printer requires a blank line after every ATX
  // heading and before a list starts under a lead-in paragraph (`Slots:`/
  // `Compound component:`) — match that here so the raw generator output
  // never drifts from what a commit-time `prettier --write` would produce.
  const lines = [`### ${e.name} — \`${e.path}\``, ''];
  lines.push(e.purpose || '_No description._');

  const props = propsFragment(e.props, e.extendsList);
  if (props) lines.push(`Props: ${props}`);
  if (e.variants.length) lines.push(`Variants: ${e.variants.join(' · ')}`);

  if (e.members) {
    lines.push('', 'Compound component:', '');
    for (const m of e.members) lines.push(renderSub(m));
  }
  if (e.slots) {
    lines.push('', 'Slots:', '');
    for (const s of e.slots) lines.push(renderSub(s));
  }
  return lines.join('\n');
};

const buildLayers = () => {
  const layers = [];
  const skipped = [];
  for (const layer of LAYERS) {
    const res = collectLayer(layer);
    layers.push({ layer, entries: res.entries });
    skipped.push(...res.skipped);
  }
  return { layers, skipped };
};

// Structural completeness: a component folder that produced no entry, or a
// compound slot whose import the parser couldn't follow, is a silent gap the
// manifest would otherwise hide. Returns human-readable issue strings.
const structuralIssues = (layers, skipped) => {
  const issues = skipped.map((s) => `${s.dir} — ${s.reason}`);
  for (const { entries } of layers) {
    for (const e of entries) {
      for (const s of [...(e.members ?? []), ...(e.slots ?? [])]) {
        if (s.unresolved)
          issues.push(`${s.accessor} — compound slot import could not be resolved`);
      }
    }
  }
  return issues;
};

const render = (layers) => {
  const total = layers.reduce((n, l) => n + l.entries.length, 0);
  const out = [
    '<!-- GENERATED by scripts/gen-ui-index.mjs — do not edit by hand. Run `pnpm gen:ui-index`. -->',
    '',
    '# @blog/ui component index',
    '',
    `_${total} components · generated from \`packages/ui/src\`. Paths are relative to \`packages/ui/src\`._`,
  ];
  for (const { layer, entries } of layers) {
    if (!entries.length) continue;
    out.push('', `## ${layer[0].toUpperCase()}${layer.slice(1)}`, '');
    out.push(entries.map(renderEntry).join('\n\n'));
  }
  return `${out.join('\n')}\n`;
};

// Every exported component and every compound member/slot must carry a JSDoc
// description. Returns the accessor names that don't.
const missingDescriptions = (layers) => {
  const missing = [];
  for (const { entries } of layers) {
    for (const e of entries) {
      if (!e.purpose) missing.push(e.name);
      for (const s of e.members ?? []) if (!s.purpose) missing.push(s.accessor);
      for (const s of e.slots ?? []) if (!s.purpose) missing.push(s.accessor);
    }
  }
  return missing;
};

const stagedTouchesUi = () => {
  const staged = execFileSync('git', ['diff', '--cached', '--name-only'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  return staged.some(
    (f) =>
      /^packages\/ui\/src\/.+\.tsx?$/.test(f) &&
      !f.endsWith('.stories.tsx') &&
      !f.endsWith('.test.tsx') &&
      !f.endsWith('.test.ts'),
  );
};

// All guards in a single parse (structure + descriptions, plus drift when
// asked). Returns human-readable problem blocks; empty means all clear.
const collectProblems = (layers, skipped, { checkDrift }) => {
  const problems = [];
  const struct = structuralIssues(layers, skipped);
  if (struct.length)
    problems.push(
      `Component index is incomplete (${struct.length}):\n  ${struct.join('\n  ')}\n` +
        '  → every atoms/molecules/organisms folder must yield an entry and every ' +
        'compound slot must resolve (see the ui-library-practices skill).',
    );
  const missing = missingDescriptions(layers);
  if (missing.length)
    problems.push(
      `Missing a component description (${missing.length}):\n  ${missing.join('\n  ')}\n` +
        '  → every exported component (incl. compound parts) needs a ' +
        '`/** Name — … */` doc comment.',
    );
  if (checkDrift) {
    const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
    if (current !== render(layers))
      problems.push(
        'COMPONENTS.md is out of date — run `pnpm gen:ui-index` and commit the result.',
      );
  }
  return problems;
};

const main = () => {
  const args = new Set(process.argv.slice(2));

  if (args.has('--if-staged') && !stagedTouchesUi()) return;

  const { layers, skipped } = buildLayers();

  if (args.has('--verify')) {
    const problems = collectProblems(layers, skipped, { checkDrift: true });
    if (problems.length) {
      console.error(problems.join('\n\n'));
      process.exit(1);
    }
    console.log('Component index is current, complete, and documented.');
    return;
  }

  if (args.has('--check-structure')) {
    const issues = structuralIssues(layers, skipped);
    if (issues.length) {
      console.error(
        `Component index is incomplete (${issues.length}):\n  ${issues.join('\n  ')}\n\n` +
          'Every atoms/molecules/organisms folder must yield an index entry and every ' +
          'compound slot must resolve. Follow the folder/naming conventions in the ' +
          'ui-library-practices skill so the index generator can see the component.',
      );
      process.exit(1);
    }
    console.log('Component index is structurally complete.');
    return;
  }

  if (args.has('--check-descriptions')) {
    const missing = missingDescriptions(layers);
    if (missing.length) {
      console.error(
        `Missing a component description (${missing.length}):\n  ${missing.join('\n  ')}\n\n` +
          'Every exported component (incl. compound parts) needs a `/** Name — … */` ' +
          'doc comment. See the ui-library-practices skill.',
      );
      process.exit(1);
    }
    console.log('All exported components are documented.');
    return;
  }

  const content = render(layers);

  if (args.has('--check')) {
    const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
    if (current !== content) {
      console.error(
        'COMPONENTS.md is out of date. Run `pnpm gen:ui-index` and commit the result.',
      );
      process.exit(1);
    }
    return;
  }

  writeFileSync(outFile, content);

  if (args.has('--if-staged')) {
    execFileSync('git', ['add', relative(repoRoot, outFile)], { cwd: repoRoot });
    // Just regenerated, so drift can't happen — but a new/changed component can
    // still be undocumented or unindexable. Block the commit if so.
    const problems = collectProblems(layers, skipped, { checkDrift: false });
    if (problems.length) {
      console.error(`${problems.join('\n\n')}\n`);
      process.exit(1);
    }
  }
};

main();
