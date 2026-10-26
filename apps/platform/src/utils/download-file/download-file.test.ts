import { type Blob, resolveObjectURL } from 'node:buffer';

import type { TMaybeUndefined } from '@blog/config';
import { faker } from '@faker-js/faker';

import { downloadFile } from './download-file';

const FILE_NAME = faker.system.fileName();
const CONTENT = faker.lorem.paragraph();

describe(downloadFile, () => {
  const link = { href: '', download: '', click: vi.fn() };
  let saved: TMaybeUndefined<Blob>;

  const download = () =>
    downloadFile(link as unknown as HTMLAnchorElement, FILE_NAME, CONTENT);

  beforeEach(() => {
    saved = undefined;
    link.click.mockReset().mockImplementation(() => {
      saved = resolveObjectURL(link.href);
    });
  });

  it('saves the content as a file under the given name', async () => {
    download();

    expect(link.download).toBe(FILE_NAME);
    await expect(saved?.text()).resolves.toBe(CONTENT);
  });

  it('releases the file once saved', () => {
    download();

    expect(resolveObjectURL(link.href)).toBeUndefined();
  });
});
