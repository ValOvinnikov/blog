import { customRender, screen } from '@web/testing/custom-render';
import { mockIdentitySectionView } from '@web/testing/pages/account-page/identity-section-fixtures';

import { IdentitySectionView } from './identity-section-view';

const MOCK_PROPS = mockIdentitySectionView();
const LINKED_STATUS = 'Linked';
const LAST_METHOD_NOTICE = "Last remaining method — can't unlink";
const UNLINK_BUTTON = 'Unlink';

const setup = customRender(IdentitySectionView, MOCK_PROPS);

describe(`<${IdentitySectionView.name}/>`, () => {
  it('renders the panel heading as a level-2 heading', () => {
    setup();

    const sectionHeading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_PROPS.heading,
    });

    expect(sectionHeading).toBeVisible();
  });

  it.each(MOCK_PROPS.providerRows.map(({ label }) => [label]))(
    'renders %s as a level-3 heading',
    (label) => {
      setup();

      const providerHeading = screen.getByRole('heading', {
        level: 3,
        name: label,
      });

      expect(providerHeading).toBeVisible();
    },
  );

  it('shows the linked-status label once per linked row', () => {
    setup();

    const linkedLabels = screen.getAllByText(LINKED_STATUS);
    const linkedRowCount = MOCK_PROPS.providerRows.filter(
      ({ isLinked }) => isLinked,
    ).length;

    expect(linkedLabels).toHaveLength(linkedRowCount);
  });

  it('shows no linked-status label when no row is linked', () => {
    setup({
      providerRows: MOCK_PROPS.providerRows.map((row) => ({
        ...row,
        isLinked: false,
      })),
    });

    const linkedLabel = screen.queryByText(LINKED_STATUS);

    expect(linkedLabel).not.toBeInTheDocument();
  });

  it('renders the given control for a row that is not the last method', () => {
    setup();

    const unlinkButton = screen.getByRole('button', { name: UNLINK_BUTTON });

    expect(unlinkButton).toBeVisible();
  });

  it('renders the display-name label and control', () => {
    setup();

    const displayNameLabel = screen.getByText(MOCK_PROPS.displayNameLabel);
    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(displayNameLabel).toBeVisible();
    expect(saveButton).toBeVisible();
  });

  it('shows the last-method notice instead of the control for the last method', () => {
    setup({
      providerRows: MOCK_PROPS.providerRows.map((row, index) =>
        index === 0 ? { ...row, isLastMethod: true } : row,
      ),
    });

    const lastMethodNotice = screen.getByText(LAST_METHOD_NOTICE);
    const unlinkButton = screen.queryByRole('button', { name: UNLINK_BUTTON });

    expect(lastMethodNotice).toBeVisible();
    expect(unlinkButton).not.toBeInTheDocument();
  });
});
