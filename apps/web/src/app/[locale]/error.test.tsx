import { LocaleErrorPage } from '@web/components/pages/locale-error-page';

import ErrorBoundary from './error';

describe('Error ([locale] error boundary route)', () => {
  it('delegates to LocaleErrorPage with the error and reset props', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc' });
    const reset = vi.fn();

    const ui = ErrorBoundary({ error, reset });

    expect(ui.type).toBe(LocaleErrorPage);
    expect(ui.props.error).toBe(error);
    expect(ui.props.reset).toBe(reset);
  });
});
