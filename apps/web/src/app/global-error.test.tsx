import { LOCALE_BCP47_TAGS } from '@blog/config';
import { GlobalErrorPage } from '@web/components/pages/global-error-page';
import { MOCK_ERROR_WITH_DIGEST } from '@web/testing/shared/error/fixtures';

import GlobalErrorRoute from './global-error';

describe(`<${GlobalErrorRoute.name}/>`, () => {
  it('wraps GlobalErrorPage in an English document with the error and reset', () => {
    const reset = vi.fn();

    const html = GlobalErrorRoute({ error: MOCK_ERROR_WITH_DIGEST, reset });

    const { lang, children: body } = html.props;
    const content = body.props.children;

    expect(lang).toBe(LOCALE_BCP47_TAGS.EN);
    expect(content.type).toBe(GlobalErrorPage);
    expect(content.props).toEqual({ error: MOCK_ERROR_WITH_DIGEST, reset });
  });
});
