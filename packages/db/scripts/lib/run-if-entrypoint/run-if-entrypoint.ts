import { pathToFileURL } from 'node:url';

function isEntrypoint(moduleUrl: string): boolean {
  const entrypoint = process.argv[1];
  if (!entrypoint) {
    return false;
  }
  return moduleUrl === pathToFileURL(entrypoint).href;
}

export function runIfEntrypoint(
  moduleUrl: string,
  main: () => Promise<void>,
  failureLabel?: string,
): void {
  if (!isEntrypoint(moduleUrl)) {
    return;
  }

  main().catch((error: unknown) => {
    if (failureLabel) {
      console.error(`${failureLabel}: unexpected failure:`, error);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  });
}
