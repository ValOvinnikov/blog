import {
  ALIGN,
  BACKGROUND_TONE,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { Section } from './section';

faker.seed(123);

const childText = faker.lorem.sentence();

const setup = customRender(Section, { children: childText });

describe(`<${Section.name}/>`, () => {
  it('renders its children', () => {
    setup();
    expect(screen.getByText(childText)).toBeVisible();
  });

  it('renders as a <div> by default', () => {
    const { container } = setup();
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders as the element passed via `as`', () => {
    renderElement(<Section as="section">{childText}</Section>);
    expect(screen.getByText(childText).closest('section')).toBeVisible();
  });

  it('renders without an appearance prop (defaults applied)', () => {
    setup({ appearance: undefined });
    expect(screen.getByText(childText)).toBeVisible();
  });

  it('renders with a partially-set appearance object (unset fields default independently)', () => {
    setup({ appearance: { background: BACKGROUND_TONE.SURFACE } });
    expect(screen.getByText(childText)).toBeVisible();
  });

  it.each([
    BACKGROUND_TONE.DEFAULT,
    BACKGROUND_TONE.SUBTLE,
    BACKGROUND_TONE.SURFACE,
    BACKGROUND_TONE.ACCENT_TINT,
    BACKGROUND_TONE.INVERSE,
  ])('renders with background tone %s', (background) => {
    setup({
      appearance: {
        background,
        spacingTop: SPACING_SCALE.MD,
        spacingBottom: SPACING_SCALE.MD,
        containerWidth: CONTAINER_WIDTH.WIDE,
        align: ALIGN.START,
        divider: false,
      },
    });
    expect(screen.getByText(childText)).toBeVisible();
  });

  it('renders with a divider', () => {
    setup({
      appearance: {
        background: BACKGROUND_TONE.DEFAULT,
        spacingTop: SPACING_SCALE.MD,
        spacingBottom: SPACING_SCALE.MD,
        containerWidth: CONTAINER_WIDTH.WIDE,
        align: ALIGN.START,
        divider: true,
      },
    });
    expect(screen.getByText(childText)).toBeVisible();
  });

  it('renders with a centered alignment', () => {
    setup({
      appearance: {
        background: BACKGROUND_TONE.DEFAULT,
        spacingTop: SPACING_SCALE.MD,
        spacingBottom: SPACING_SCALE.MD,
        containerWidth: CONTAINER_WIDTH.WIDE,
        align: ALIGN.CENTER,
        divider: false,
      },
    });
    expect(screen.getByText(childText)).toBeVisible();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'section' });
    expect(screen.getByTestId('section')).toBeVisible();
  });

  it('accepts a className override on the root', () => {
    const { container } = setup({ className: 'custom-class' });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
