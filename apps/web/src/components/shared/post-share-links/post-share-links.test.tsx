import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { PostShareLinks } from './post-share-links';

const setup = customRender(PostShareLinks, {
  url: 'https://example.com/blog/hello-world',
  title: 'Hello World',
});

describe(`<${PostShareLinks.name}/>`, () => {
  it('renders an X share link and a LinkedIn share link, each with its own platform icon', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: /Share/ }));

    const xShareLink = screen.getByRole('menuitem', { name: /Share on X/ });
    expect(xShareLink).toBeVisible();
    expect(xShareLink.querySelector('svg')).toBeInTheDocument();

    const linkedInShareLink = screen.getByRole('menuitem', {
      name: /Share on LinkedIn/,
    });
    expect(linkedInShareLink).toBeVisible();

    expect(xShareLink.querySelector('svg')?.outerHTML).not.toBe(
      linkedInShareLink.querySelector('svg')?.outerHTML,
    );
  });

  it('builds each share link href from the given url and title', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: /Share/ }));

    expect(
      screen.getByRole('menuitem', { name: /Share on X/ }),
    ).toHaveAttribute(
      'href',
      expect.stringContaining(
        encodeURIComponent('https://example.com/blog/hello-world'),
      ),
    );
  });
});
