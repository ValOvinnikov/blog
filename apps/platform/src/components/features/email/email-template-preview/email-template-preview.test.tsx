import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { EmailTemplatePreview } from './email-template-preview';

const render = renderWithIntl;

describe(EmailTemplatePreview, () => {
  it('renders the preview iframe with an empty sandbox attribute', () => {
    render(
      <EmailTemplatePreview html="<p>Hi there</p>" title="Email preview" />,
    );

    const iframe = screen.getByTitle('Email preview');
    expect(iframe).toHaveAttribute('sandbox', '');
  });
});
