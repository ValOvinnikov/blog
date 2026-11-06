import type { TMaybeUndefined } from '@blog/config';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_PRODUCT_NAME } from '@platform/testing/env/fixtures';

import { FooterPoweredByNote } from './footer-powered-by-note';

const NOTE = makeEnTranslator('lookForm')('footerPoweredByNote', {
  productName: MOCK_PRODUCT_NAME,
});

const setup = (productName: TMaybeUndefined<string>) =>
  renderWithIntl(
    <PoweredByMarkProvider productName={productName}>
      <FooterPoweredByNote />
    </PoweredByMarkProvider>,
  );

describe(`<${FooterPoweredByNote.name}/>`, () => {
  it('explains the mark by the product name', () => {
    setup(MOCK_PRODUCT_NAME);

    const note = screen.getByText(NOTE);

    expect(note).toBeVisible();
  });

  it('says nothing while no mark is drawn', () => {
    setup(undefined);

    const note = screen.queryByRole('paragraph');

    expect(note).not.toBeInTheDocument();
  });
});
