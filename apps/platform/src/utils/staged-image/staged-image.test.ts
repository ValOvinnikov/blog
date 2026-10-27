import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { UPLOAD_OPERATION, UPLOAD_REFUSAL } from '@platform/constants/upload';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';

import {
  createStagingHandlers,
  isSameStagedImage,
  persistStagedImage,
} from './staged-image';

faker.seed(6006);

const MOCK_STORED_URL = faker.internet.url();
const MOCK_LOCAL_URL = `blob:${faker.internet.url()}`;
const MOCK_FILE = new File(
  [faker.lorem.word()],
  faker.system.commonFileName('png'),
  {
    type: 'image/png',
  },
);

describe(persistStagedImage, () => {
  it('uploads a staged file and returns the stored url', async () => {
    const upload = vi.fn().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: MOCK_STORED_URL,
    });
    const clear = vi.fn();

    const result = await persistStagedImage(
      { url: MOCK_LOCAL_URL, file: MOCK_FILE },
      { upload, clear },
    );

    const [formData] = upload.mock.calls[0] ?? [];
    expect(result).toEqual({ ok: true, data: { url: MOCK_STORED_URL } });
    expect(formData.get('file')).toBe(MOCK_FILE);
    expect(clear).not.toHaveBeenCalled();
  });

  it('clears the stored image when nothing is staged', async () => {
    const upload = vi.fn();
    const clear = vi
      .fn()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });

    const result = await persistStagedImage(
      { url: undefined },
      { upload, clear },
    );

    expect(result).toEqual({ ok: true, data: { url: undefined } });
    expect(upload).not.toHaveBeenCalled();
  });

  it('passes an upload refusal through as an upload failure', async () => {
    const refusal = {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FILE_MISSING,
    };
    const upload = vi.fn().mockResolvedValue(refusal);

    const result = await persistStagedImage(
      { url: MOCK_LOCAL_URL, file: MOCK_FILE },
      { upload, clear: vi.fn() },
    );

    expect(result).toEqual({
      ok: false,
      error: { failure: refusal, operation: UPLOAD_OPERATION.UPLOAD },
    });
  });

  it('passes a clear error through as a clear failure', async () => {
    const serverError = { outcome: ACTION_OUTCOME.SERVER_ERROR };
    const clear = vi.fn().mockResolvedValue(serverError);

    const result = await persistStagedImage(
      { url: undefined },
      { upload: vi.fn(), clear },
    );

    expect(result).toEqual({
      ok: false,
      error: { failure: serverError, operation: UPLOAD_OPERATION.CLEAR },
    });
  });
});

describe(isSameStagedImage, () => {
  it('matches two images with the same url and file', () => {
    const image = { url: MOCK_LOCAL_URL, file: MOCK_FILE };

    expect(isSameStagedImage(image, { ...image })).toBe(true);
  });

  it('tells apart two images with different urls', () => {
    expect(
      isSameStagedImage({ url: MOCK_STORED_URL }, { url: MOCK_LOCAL_URL }),
    ).toBe(false);
  });

  it('tells apart two images with the same url but a different file', () => {
    const otherFile = new File([faker.lorem.word()], MOCK_FILE.name);

    expect(
      isSameStagedImage(
        { url: MOCK_LOCAL_URL, file: MOCK_FILE },
        { url: MOCK_LOCAL_URL, file: otherFile },
      ),
    ).toBe(false);
  });
});

describe(createStagingHandlers, () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stages a picked file with a local preview url', () => {
    const onStage = vi.fn();
    const { onPick } = createStagingHandlers(onStage);

    onPick(MOCK_FILE);

    expect(onStage).toHaveBeenCalledExactlyOnceWith({
      url: MOCK_STAGED_LOGO_BLOB_URL,
      file: MOCK_FILE,
    });
  });

  it('stages an empty image when cleared', () => {
    const onStage = vi.fn();
    const { onClear } = createStagingHandlers(onStage);

    onClear();

    expect(onStage).toHaveBeenCalledExactlyOnceWith({ url: undefined });
  });
});
