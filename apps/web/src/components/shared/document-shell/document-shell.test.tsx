import { DocumentShell } from './document-shell';

const renderShell = (lang = 'en', children = <div>content</div>) =>
  DocumentShell({ lang, children });

const headChildren = (html: ReturnType<typeof renderShell>) => {
  const [head] = html.props.children;
  return [head.props.children].flat();
};

describe(`<${DocumentShell.name}/>`, () => {
  it('declares the given language on the document', () => {
    expect(renderShell('nl').props.lang).toBe('nl');
  });

  it('mounts children in the body', () => {
    const children = <div>content</div>;
    const [, body] = renderShell('en', children).props.children;

    expect(body.props.children).toBe(children);
  });

  it('preconnects to the Sanity image CDN without crossorigin', () => {
    const preconnect = headChildren(renderShell()).find(
      (child: React.ReactElement<{ rel?: string }>) =>
        child?.type === 'link' && child.props.rel === 'preconnect',
    );

    expect(preconnect.props.href).toBe('https://cdn.sanity.io');
    expect(preconnect.props.crossOrigin).toBeUndefined();
  });

  it('renders the dark-mode bootstrap script in the head', () => {
    const script = headChildren(renderShell()).find(
      (child: React.ReactElement) => child?.type === 'script',
    );

    expect(script.props.dangerouslySetInnerHTML.__html).toContain(
      "localStorage.getItem('theme')",
    );
  });
});
