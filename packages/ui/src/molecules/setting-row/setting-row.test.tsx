import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { SettingRow } from './setting-row';

faker.seed(123);

const label = faker.lorem.words(3);
const description = faker.lorem.sentence();

const setup = customRender(SettingRow, { label });

describe(`<${SettingRow.name}/>`, () => {
  it('renders the label as an h3 heading by default', () => {
    setup();
    expect(
      screen.getByRole('heading', { level: 3, name: label }),
    ).toBeVisible();
  });

  it('renders the label at a custom heading level', () => {
    setup({ labelLevel: 2 });
    expect(
      screen.getByRole('heading', { level: 2, name: label }),
    ).toBeVisible();
  });

  it('renders the description when given', () => {
    setup({ description });
    expect(screen.getByText(description)).toBeVisible();
  });

  it('does not render a description when omitted', () => {
    setup();
    expect(screen.queryByText(description)).not.toBeInTheDocument();
  });

  it('renders control-slot children', () => {
    setup({ children: <button>request export</button> });
    expect(
      screen.getByRole('button', { name: 'request export' }),
    ).toBeVisible();
  });

  it('does not render a control wrapper when no children are given', () => {
    setup();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with the danger tone', () => {
    setup({ tone: 'danger', children: <button>delete account</button> });
    expect(
      screen.getByRole('heading', { level: 3, name: label }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'delete account' }),
    ).toBeVisible();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'setting-row' });
    expect(screen.getByTestId('setting-row')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
