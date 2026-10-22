import { downloadJson } from './download-json';

const FILE_NAME = 'export.json';
const OBJECT_URL = 'blob:export';
const VALUE = { subscribers: [{ email: 'reader@example.com' }] };

describe(downloadJson, () => {
  const link = { href: '', download: '', click: vi.fn() };
  let blob: Blob | undefined;

  beforeEach(() => {
    blob = undefined;
    link.click.mockReset();
    vi.stubGlobal('document', { createElement: () => link });
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      blob = value as Blob;
      return OBJECT_URL;
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('saves the value as a JSON file under the given name', async () => {
    downloadJson(FILE_NAME, VALUE);

    expect(link.click).toHaveBeenCalledOnce();
    expect(link).toMatchObject({ href: OBJECT_URL, download: FILE_NAME });
    await expect(blob?.text().then(JSON.parse)).resolves.toEqual(VALUE);
  });

  it('releases the file once saved', () => {
    downloadJson(FILE_NAME, VALUE);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });
});
