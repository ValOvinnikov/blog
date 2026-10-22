import { type Blob, resolveObjectURL } from 'node:buffer';

import type { TMaybeUndefined } from '@blog/config';
import { faker } from '@faker-js/faker';

import { downloadJson } from './download-json';

const FILE_NAME = faker.system.fileName();
const VALUE = { subscribers: [{ id: faker.string.uuid() }] };

describe(downloadJson, () => {
  const link = { href: '', download: '', click: vi.fn() };
  let saved: TMaybeUndefined<Blob>;

  const download = () =>
    downloadJson(link as unknown as HTMLAnchorElement, FILE_NAME, VALUE);

  beforeEach(() => {
    saved = undefined;
    link.click.mockReset().mockImplementation(() => {
      saved = resolveObjectURL(link.href);
    });
  });

  it('saves the value as a JSON file under the given name', async () => {
    download();

    expect(link.download).toBe(FILE_NAME);
    await expect(saved?.text().then(JSON.parse)).resolves.toEqual(VALUE);
  });

  it('releases the file once saved', () => {
    download();

    expect(resolveObjectURL(link.href)).toBeUndefined();
  });
});
