import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_ROOT = fileURLToPath(new URL('..', import.meta.url));
const ENTRYPOINT = fileURLToPath(new URL('./index.ts', import.meta.url));

const FORBIDDEN_SPECIFIERS = ['server-only', 'resend'];

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
    return resolve(SRC_ROOT, specifier.slice('@blog/email/'.length));
  }
  return null;
}

function toFilePath(modulePath: string): string {
  if (modulePath.endsWith('.ts')) {
    return modulePath;
  }
  return `${modulePath}.ts`;
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

describe('the @blog/email/html subpath', () => {
  it('never transitively imports server-only, resend, or the env module', () => {
    const { internal, external } = collectModuleGraph(ENTRYPOINT);

    for (const forbidden of FORBIDDEN_SPECIFIERS) {
      expect(external.has(forbidden)).toBe(false);
    }

    const importsEnvModule = [...internal].some((file) =>
      file.includes(`${resolve(SRC_ROOT, 'utils/env')}`),
    );
    expect(importsEnvModule).toBe(false);
  });
});
