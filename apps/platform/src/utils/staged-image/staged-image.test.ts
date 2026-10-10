import { persistStagedImage } from './staged-image';

describe('persistStagedImage', () => {
  it('uploads a staged file and returns the stored url', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const upload = vi
      .fn()
      .mockResolvedValue({ ok: true, url: 'https://cdn/a' });
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
    const clear = vi.fn().mockResolvedValue({ ok: true });

    const result = await persistStagedImage(
      { url: undefined },
      { upload, clear },
    );

    expect(result).toEqual({ ok: true, image: { url: undefined } });
    expect(upload).not.toHaveBeenCalled();
  });

  it('passes an upload failure through', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    const upload = vi.fn().mockResolvedValue({ ok: false, error: 'Too big.' });

    const result = await persistStagedImage(
      { url: 'blob:local', file },
      { upload, clear: vi.fn() },
    );

    expect(result).toEqual({ ok: false, error: 'Too big.' });
  });

  it('passes a clear failure through', async () => {
    const clear = vi.fn().mockResolvedValue({ ok: false, error: 'Nope.' });

    const result = await persistStagedImage(
      { url: undefined },
      { upload: vi.fn(), clear },
    );

    expect(result).toEqual({ ok: false, error: 'Nope.' });
  });
});
