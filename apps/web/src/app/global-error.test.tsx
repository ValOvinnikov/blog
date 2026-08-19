import { GlobalErrorPage } from '@web/components/pages/global-error-page';

import GlobalErrorRoute from './global-error';

describe('GlobalError (root global-error boundary route)', () => {
  it('renders its own html/body and delegates to GlobalErrorPage', () => {
    const error = Object.assign(new Error('root layout blew up'), {
      digest: 'xyz',
    });
    const reset = vi.fn();

    const html = GlobalErrorRoute({ error, reset });

    expect(html.type).toBe('html');
    expect(html.props.lang).toBe('en');

    const body = html.props.children;
    expect(body.type).toBe('body');

    const content = body.props.children;
    expect(content.type).toBe(GlobalErrorPage);
    expect(content.props.error).toBe(error);
    expect(content.props.reset).toBe(reset);
  });
});
