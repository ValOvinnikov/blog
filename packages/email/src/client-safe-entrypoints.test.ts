import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

const FORBIDDEN_SPECIFIERS = ['server-only', 'resend'];

function readClientSafeEntrypoints(): string[] {
  const manifest = JSON.parse(
    readFileSync(resolve(PACKAGE_ROOT, 'package.json'), 'utf8'),
  ) as { exports: Record<string, string> };

  return Object.entries(manifest.exports)
    .filter(([specifier]) => specifier !== '.')
    .map(([, entryPath]) => resolve(PACKAGE_ROOT, entryPath));
}

function extractSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const fromImport =
    /(?:^|\n)\s*(?:import|export)\b[^'"]*?from\s+['"]([^'"]+)['"]/g;
  const bareImport = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;

  for (const pattern of [fromImport, bareImport]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) {
      const specifier = match[1];
      if (specifier !== undefined) {
        specifiers.push(specifier);
      }
    }
  }

  return specifiers;
}

function toModulePath(specifier: string, fromFile: string): string | null {
  if (specifier.startsWith('.')) {
    return resolve(dirname(fromFile), specifier);
  }
  if (specifier.startsWith('@blog/email/')) {
    return resolve(PACKAGE_ROOT, 'src', specifier.slice('@blog/email/'.length));
  }
  return null;
}

function toFilePath(modulePath: string): string {
  if (modulePath.endsWith('.ts')) {
    return modulePath;
  }
  const asFile = `${modulePath}.ts`;
  if (existsSync(asFile)) {
    return asFile;
  }
  return resolve(modulePath, 'index.ts');
}

function collectModuleGraph(entryFile: string): {
  internal: Set<string>;
  external: Set<string>;
} {
  const internal = new Set<string>();
  const external = new Set<string>();
  const queue = [entryFile];

  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined || internal.has(current)) {
      continue;
    }
    internal.add(current);

    const source = readFileSync(current, 'utf8');
    for (const specifier of extractSpecifiers(source)) {
      const modulePath = toModulePath(specifier, current);
      if (modulePath === null) {
        external.add(specifier);
        continue;
      }
      queue.push(toFilePath(modulePath));
    }
  }

  return { internal, external };
}

describe('every client-safe entrypoint declared in package.json', () => {
  const entrypoints = readClientSafeEntrypoints();

  it('declares at least one client-safe entrypoint to check', () => {
    expect(entrypoints.length).toBeGreaterThan(0);
  });

  it.each(entrypoints)(
    'never transitively imports server-only, resend, or the env module: %s',
    (entryFile) => {
      const { internal, external } = collectModuleGraph(entryFile);

      for (const forbidden of FORBIDDEN_SPECIFIERS) {
        expect(external.has(forbidden)).toBe(false);
      }

      const importsEnvModule = [...internal].some((file) =>
        file.includes(resolve(PACKAGE_ROOT, 'src/utils/env')),
      );
      expect(importsEnvModule).toBe(false);
    },
  );
});
