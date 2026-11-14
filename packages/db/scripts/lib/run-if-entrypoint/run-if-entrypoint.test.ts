import { pathToFileURL } from 'node:url';

import { faker } from '@faker-js/faker';

import { runIfEntrypoint } from './run-if-entrypoint';

faker.seed(7423);

const MOCK_ENTRYPOINT_PATH = `/${faker.system.directoryPath()}/run.ts`;
const MOCK_OTHER_PATH = `/${faker.system.directoryPath()}/other.ts`;
const MOCK_ENTRYPOINT_URL = pathToFileURL(MOCK_ENTRYPOINT_PATH).href;
const MOCK_FAILURE_LABEL = faker.lorem.slug();
const MOCK_ERROR = new Error(faker.lorem.sentence());

const originalArgv = process.argv;
const resolvingMain = vi.fn<() => Promise<void>>();

beforeEach(() => {
  process.exitCode = undefined;
  resolvingMain.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

function runAs(argvEntry: string, main: () => Promise<void>, label?: string) {
  process.argv = [process.execPath, argvEntry];
  runIfEntrypoint(MOCK_ENTRYPOINT_URL, main, label);
}

describe('runIfEntrypoint', () => {
  it('does not run main when another file is the entrypoint', () => {
    runAs(MOCK_OTHER_PATH, resolvingMain);

    expect(resolvingMain).not.toHaveBeenCalled();
  });

  it('runs main and leaves the exit code unset when it resolves', async () => {
    runAs(MOCK_ENTRYPOINT_PATH, resolvingMain);
    await vi.waitFor(() => expect(resolvingMain).toHaveBeenCalledOnce());

    expect(process.exitCode).toBeUndefined();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('prints the error and exits 1 when main rejects', async () => {
    runAs(MOCK_ENTRYPOINT_PATH, () => Promise.reject(MOCK_ERROR));

    await vi.waitFor(() => expect(process.exitCode).toBe(1));
    expect(console.error).toHaveBeenCalledWith(MOCK_ERROR);
  });

  it('prefixes the printed error with the failure label when one is given', async () => {
    runAs(
      MOCK_ENTRYPOINT_PATH,
      () => Promise.reject(MOCK_ERROR),
      MOCK_FAILURE_LABEL,
    );

    await vi.waitFor(() => expect(process.exitCode).toBe(1));
    expect(console.error).toHaveBeenCalledWith(
      `${MOCK_FAILURE_LABEL}: unexpected failure:`,
      MOCK_ERROR,
    );
  });
});
