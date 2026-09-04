import RootLayout from './layout';

describe(`<${RootLayout.name}/>`, () => {
  it('mounts children in the body', () => {
    const children = <div>content</div>;
    const html = RootLayout({ children });

    const [, body] = html.props.children;

    expect(body.props.children).toBe(children);
  });

  it('preconnects to the Sanity image CDN without crossorigin', () => {
    const html = RootLayout({ children: <div>content</div> });

    const [head] = html.props.children;
    const headChildren = [head.props.children].flat();
    const preconnect = headChildren.find(
      (child: React.ReactElement<{ rel?: string }>) =>
        child?.type === 'link' && child.props.rel === 'preconnect',
    );

    expect(preconnect.props.href).toBe('https://cdn.sanity.io');
    expect(preconnect.props.crossOrigin).toBeUndefined();
  });

  it('renders the dark-mode bootstrap script in the head', () => {
    const html = RootLayout({ children: <div>content</div> });

    const [head] = html.props.children;
    const headChildren = [head.props.children].flat();
    const script = headChildren.find(
      (child: React.ReactElement) => child?.type === 'script',
    );

    expect(script.props.dangerouslySetInnerHTML.__html).toContain(
      "localStorage.getItem('theme')",
    );
  });
});
