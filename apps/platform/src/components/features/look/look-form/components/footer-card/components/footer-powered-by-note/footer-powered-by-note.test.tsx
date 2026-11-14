import { SHINEFOLD_LOGO_NAME } from '@blog/utils/shinefold-logo';
import { PoweredByMarkProvider } from '@platform/context/powered-by-mark-provider';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';

import { FooterPoweredByNote } from './footer-powered-by-note';

const NOTE = makeEnTranslator('lookForm')('footerPoweredByNote', {
  productName: SHINEFOLD_LOGO_NAME,
});

const setup = (hasPoweredByMark: boolean) =>
  renderWithIntl(
    <PoweredByMarkProvider hasPoweredByMark={hasPoweredByMark}>
      <FooterPoweredByNote />
    </PoweredByMarkProvider>,
  );

describe(`<${FooterPoweredByNote.name}/>`, () => {
  it('explains the mark by the Shinefold name', () => {
    setup(true);

    const note = screen.getByText(NOTE);

    expect(note).toBeVisible();
  });

  it('says nothing while no mark is drawn', () => {
    setup(false);

    const note = screen.queryByRole('paragraph');

    expect(note).not.toBeInTheDocument();
  });
});
