import { type Blob, resolveObjectURL } from 'node:buffer';

import type { TMaybeUndefined } from '@blog/config';
import { faker } from '@faker-js/faker';

import { downloadFile } from './download-file';

faker.seed(6006);

const MOCK_FILE_NAME = faker.system.fileName();
const MOCK_CONTENT = faker.lorem.paragraph();

describe(downloadFile, () => {
  const link = { href: '', download: '', click: vi.fn() };
  let saved: TMaybeUndefined<Blob>;

  beforeEach(() => {
    saved = undefined;
    link.click.mockReset().mockImplementation(() => {
      saved = resolveObjectURL(link.href);
    });

    downloadFile(
      link as unknown as HTMLAnchorElement,
      MOCK_FILE_NAME,
      MOCK_CONTENT,
    );
  });

  it('saves the content as a file under the given name', async () => {
    expect(link.download).toBe(MOCK_FILE_NAME);
    await expect(saved?.text()).resolves.toBe(MOCK_CONTENT);
  });

  it('releases the file once saved', () => {
    expect(resolveObjectURL(link.href)).toBeUndefined();
  });
});
