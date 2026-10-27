import { DEPTH, LOCALE_BCP47_TAGS, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { DEPTH_STORAGE_KEY } from '@web/config/depth-script';
import {
  customRender,
  renderElement,
  screen,
  waitFor,
} from '@web/testing/custom-render';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

import { DepthProvider, useDepth } from './depth-provider';

faker.seed(6012);

const MOCK_BODY_TEXT = faker.lorem.sentence();
const MOCK_UNKNOWN_DEPTH = faker.lorem.word();
const DEPTH_TEST_ID = 'depth';
const DEPTH_ATTRIBUTE = 'data-depth';
const DEPTH_ROOT_TEST_ID = 'depth-root';
const BOOTSTRAP_SCRIPT_TEST_ID = 'depth-bootstrap-script';

const renderHydrated = (ui: ReactElement) => {
  const wrapped = (
    <NextIntlClientProvider
      locale={LOCALE_BCP47_TAGS.EN}
      messages={SITE_MESSAGES}
    >
      {ui}
    </NextIntlClientProvider>
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(wrapped);
  document.body.appendChild(container);

  return renderElement(ui, { hydrate: true, container });
};

const ReadDepth = () => {
  const { depth, setDepth } = useDepth();
  return (
    <>
      <span data-testid={DEPTH_TEST_ID}>{depth}</span>
      <button type="button" onClick={() => setDepth(DEPTH.DEEP)}>
        Go deep
      </button>
    </>
  );
};

const setup = customRender(DepthProvider, {
  hasSkim: true,
  hasDeep: true,
  children: <ReadDepth />,
});

describe(`<${DepthProvider.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    localStorage.clear();
    user = userEvent.setup();
  });

  it('renders children', () => {
    setup({ children: <p>{MOCK_BODY_TEXT}</p> });

    const body = screen.getByText(MOCK_BODY_TEXT);

    expect(body).toBeVisible();
  });

  it('defaults to the read depth when nothing is stored', async () => {
    setup();

    const depth = screen.getByTestId(DEPTH_TEST_ID);
    const depthRoot = screen.getByTestId(DEPTH_ROOT_TEST_ID);

    await waitFor(() => expect(depth).toHaveTextContent(DEPTH.READ));
    expect(depthRoot).toHaveAttribute(DEPTH_ATTRIBUTE, DEPTH.READ);
  });

  it('omits the bootstrap script on a plain client-side mount', async () => {
    setup();

    const depth = screen.getByTestId(DEPTH_TEST_ID);
    await waitFor(() => expect(depth).toHaveTextContent(DEPTH.READ));
    const bootstrapScript = screen.queryByTestId(BOOTSTRAP_SCRIPT_TEST_ID);

    expect(bootstrapScript).not.toBeInTheDocument();
  });

  it.each([
    {
      title: 'ignores an unrecognised stored depth',
      stored: MOCK_UNKNOWN_DEPTH,
      hasSkim: true,
      hasDeep: true,
      expected: DEPTH.READ,
    },
    {
      title: 'clamps a stored skim depth when the post has no skim',
      stored: DEPTH.SKIM,
      hasSkim: false,
      hasDeep: false,
      expected: DEPTH.READ,
    },
    {
      title: 'restores a stored deep depth when the post has asides',
      stored: DEPTH.DEEP,
      hasSkim: false,
      hasDeep: true,
      expected: DEPTH.DEEP,
    },
    {
      title: 'clamps a stored deep depth when the post has no asides',
      stored: DEPTH.DEEP,
      hasSkim: true,
      hasDeep: false,
      expected: DEPTH.READ,
    },
  ])('$title', async ({ stored, hasSkim, hasDeep, expected }) => {
    localStorage.setItem(DEPTH_STORAGE_KEY, stored);
    setup({ hasSkim, hasDeep });

    const depth = screen.getByTestId(DEPTH_TEST_ID);
    const depthRoot = screen.getByTestId(DEPTH_ROOT_TEST_ID);

    await waitFor(() => expect(depth).toHaveTextContent(expected));
    expect(depthRoot).toHaveAttribute(DEPTH_ATTRIBUTE, expected);
  });

  it('re-clamps the stored depth when the post changes without a remount', async () => {
    localStorage.setItem(DEPTH_STORAGE_KEY, DEPTH.DEEP);
    const { rerender } = setup({ hasSkim: false, hasDeep: true });

    const depth = screen.getByTestId(DEPTH_TEST_ID);
    await waitFor(() => expect(depth).toHaveTextContent(DEPTH.DEEP));

    rerender(
      <DepthProvider hasSkim={false} hasDeep={false}>
        <ReadDepth />
      </DepthProvider>,
    );

    await waitFor(() => expect(depth).toHaveTextContent(DEPTH.READ));
  });

  it('includes the bootstrap script in server-rendered markup', () => {
    const html = renderToString(
      <NextIntlClientProvider
        locale={LOCALE_BCP47_TAGS.EN}
        messages={SITE_MESSAGES}
      >
        <DepthProvider hasSkim={true} hasDeep={true}>
          <p>{MOCK_BODY_TEXT}</p>
        </DepthProvider>
      </NextIntlClientProvider>,
    );

    expect(html).toContain('<script');
  });

  it('drops the bootstrap script after hydration and on later re-renders', async () => {
    const { rerender } = renderHydrated(
      <DepthProvider hasSkim={false} hasDeep={true}>
        <ReadDepth />
      </DepthProvider>,
    );

    const depth = screen.getByTestId(DEPTH_TEST_ID);
    await waitFor(() => expect(depth).toHaveTextContent(DEPTH.READ));
    const scriptAfterHydration = screen.queryByTestId(BOOTSTRAP_SCRIPT_TEST_ID);

    expect(scriptAfterHydration).not.toBeInTheDocument();

    rerender(
      <DepthProvider hasSkim={true} hasDeep={false}>
        <ReadDepth />
      </DepthProvider>,
    );
    const scriptAfterRerender = screen.queryByTestId(BOOTSTRAP_SCRIPT_TEST_ID);

    expect(scriptAfterRerender).not.toBeInTheDocument();
  });

  it('persists the chosen depth and reflects it on the wrapper', async () => {
    setup({ hasSkim: false, hasDeep: true });

    const goDeepButton = screen.getByRole('button', { name: 'Go deep' });
    const depthRoot = screen.getByTestId(DEPTH_ROOT_TEST_ID);
    await user.click(goDeepButton);

    expect(localStorage.getItem(DEPTH_STORAGE_KEY)).toBe(DEPTH.DEEP);
    await waitFor(() =>
      expect(depthRoot).toHaveAttribute(DEPTH_ATTRIBUTE, DEPTH.DEEP),
    );
  });
});
