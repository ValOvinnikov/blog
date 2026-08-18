import { ErrorPage } from '@web/components/pages/error-page';

import ErrorBoundary from './error';

describe('Error (root error boundary route)', () => {
  it('delegates to ErrorPage with the error and reset props', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc' });
    const reset = vi.fn();

    const ui = ErrorBoundary({ error, reset });

    expect(ui.type).toBe(ErrorPage);
    expect(ui.props.error).toBe(error);
    expect(ui.props.reset).toBe(reset);
  });
});
