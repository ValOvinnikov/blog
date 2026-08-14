import { sanitizeSvgMarkup } from './sanitize-svg-markup';

describe(sanitizeSvgMarkup, () => {
  it('leaves a benign SVG intact', () => {
    const markup =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).toContain('<circle');
    expect(result).toContain('fill="currentColor"');
  });

  it('strips an embedded <script> element', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><script>alert(document.cookie)</script><circle cx="12" cy="12" r="10"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(document.cookie)');
    expect(result).toContain('<circle');
  });

  it('strips an onload event-handler attribute', () => {
    const markup =
      '<svg viewBox="0 0 24 24" onload="alert(document.domain)"><circle cx="12" cy="12" r="10"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).not.toContain('onload');
    expect(result).not.toContain('alert(document.domain)');
  });

  it('strips a javascript: URI on an anchor href', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><a href="javascript:alert(1)"><circle cx="12" cy="12" r="10"/></a></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).not.toContain('javascript:');
  });

  it('strips a reference to an external origin', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><a href="https://attacker.example/track"><circle cx="12" cy="12" r="10"/></a></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).not.toContain('attacker.example');
  });

  it('keeps a same-document fragment reference', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><circle cx="12" cy="12" r="10" fill="url(#g)"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).toContain('fill="url(#g)"');
  });

  it('keeps a data: URI reference in a presentation attribute', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><rect fill="url(data:image/svg+xml;base64,PHN2Zy8+)"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).toContain('url(data:image/svg+xml;base64,PHN2Zy8+)');
  });

  it('strips an external url() reference from a presentation attribute', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><rect fill="url(https://attacker.example/track.png#x)"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).not.toContain('attacker.example');
    expect(result).not.toContain('url(');
  });

  it('strips an external url() reference from a <style> element', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><style>.a{fill:url(https://attacker.example/t.png)}</style><rect class="a" width="10" height="10"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).not.toContain('attacker.example');
    expect(result).not.toContain('url(');
  });

  it('keeps a fragment url() reference inside a <style> element', () => {
    const markup =
      '<svg viewBox="0 0 24 24"><style>.a{fill:url(#g)}</style><rect class="a" width="10" height="10"/></svg>';

    const result = sanitizeSvgMarkup(markup);

    expect(result).toContain('url(#g)');
  });

  it('returns undefined when nothing recognizable as an SVG survives sanitization', () => {
    const result = sanitizeSvgMarkup('not svg markup at all');

    expect(result).toBeUndefined();
  });
});
