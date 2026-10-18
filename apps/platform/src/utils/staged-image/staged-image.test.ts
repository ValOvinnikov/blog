import { ACTION_OUTCOME } from '@blog/config';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';

import { persistStagedImage } from './staged-image';

describe('persistStagedImage', () => {
  it('uploads a staged file and returns the stored url', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const upload = vi.fn().mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      url: 'https://cdn/a',
    });
    const clear = vi.fn();

    const result = await persistStagedImage(
      { url: 'blob:local', file },
      { upload, clear },
    );

    expect(result).toEqual({ ok: true, image: { url: 'https://cdn/a' } });
    expect(upload.mock.calls[0]?.[0].get('file')).toBe(file);
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

    expect(result).toEqual({ ok: true, image: { url: undefined } });
    expect(upload).not.toHaveBeenCalled();
  });

  it('passes an upload refusal through as an upload failure', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const upload = vi.fn().mockResolvedValue({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: UPLOAD_REFUSAL.FILE_MISSING,
    });

    const result = await persistStagedImage(
      { url: 'blob:local', file },
      { upload, clear: vi.fn() },
    );

    expect(result).toEqual({
      ok: false,
      failure: {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_MISSING,
      },
      operation: 'UPLOAD',
    });
  });

  it('passes a clear error through as a clear failure', async () => {
    const clear = vi
      .fn()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SERVER_ERROR });

    const result = await persistStagedImage(
      { url: undefined },
      { upload: vi.fn(), clear },
    );

    expect(result).toEqual({
      ok: false,
      failure: { outcome: ACTION_OUTCOME.SERVER_ERROR },
      operation: 'CLEAR',
    });
  });
});
