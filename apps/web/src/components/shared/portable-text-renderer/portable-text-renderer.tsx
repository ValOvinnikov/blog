import {
  ASIDE_KIND,
  type Aside as TAsideBlock,
  type BodyImage,
  type Code,
  type RichText as TPortableText,
  type TAsideKind,
} from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { InlineCode } from '@blog/ui/atoms/inline-code';
import { Prose } from '@blog/ui/atoms/prose';
import { ProseLink } from '@blog/ui/atoms/prose-link';
import { QuoteBlock } from '@blog/ui/atoms/quote-block';
import { ImageWithCaption } from '@blog/ui/molecules/image-with-caption';
import {
  PortableText,
  type PortableTextBlockComponent,
  type PortableTextComponents,
  type PortableTextMarkComponentProps,
} from '@portabletext/react';
import { DeepAside } from '@web/components/shared/deep-aside';
import { SanityImage } from '@web/components/shared/sanity-image';
import { SmartLink } from '@web/components/shared/smart-link';
import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';
import { segmentPortableTextBody } from '@web/utils/segment-portable-text-body';
import { toPortableTextImage } from '@web/utils/to-portable-text-image';
import { Fragment } from 'react';

import { CodeBlock } from './code-block';
import { portableTextRendererVariants } from './portable-text-renderer-variants';

export interface IPortableTextRendererProps {
  value: TPortableText;
  /**
   * CDN origin for images embedded in the body. Body content is fetched
   * unprojected, so a `bodyImage` block carries only a bare asset
   * reference rather than an already-resolved `ISanityImage` — unlike a
   * view-model image, it can't carry its own origin, so the caller
   * supplies one.
   */
  baseUrl: string;
  /**
   * The precomputed `extractPostHeadings(value)` outline; when passed, each
   * matching h2/h3 renders with that heading's `id` so anchor links resolve.
   * Omit it where the same body could render more than once (e.g. a
   * repeatable page-builder module) to avoid colliding ids.
   */
  headings?: TPostHeading[];
  /**
   * Translated label per `ASIDE_KIND`, for an `aside` block's `DeepAside`
   * wrapper — supplied by the caller (next-intl at the page level). A body
   * with no `aside` blocks (the common case outside the post detail route)
   * can omit this; an untranslated fallback (the raw `kind` value) is used
   * in the rare case an `aside` block appears without it.
   */
  asideKindLabels?: Partial<Record<TAsideKind, string>>;
}

interface ILinkAnnotation {
  _type: 'link';
  href?: string;
}

const s = portableTextRendererVariants();

/**
 * Builds the `h2`/`h3` block renderers, stamping each rendered heading with
 * the `id` from its matching entry in `headings` (empty by default) so it
 * resolves to the anchor `PostContentsRail` links to.
 */
const headingBlockComponents = (
  headings: TPostHeading[],
): Record<'h2' | 'h3', PortableTextBlockComponent> => {
  const idByKey = new Map(headings.map((heading) => [heading.key, heading.id]));
  const headingId = (key?: string) => (key ? idByKey.get(key) : undefined);
  const headingClassName = (key?: string) =>
    headingId(key) ? s.headingAnchor() : undefined;

  const H2: PortableTextBlockComponent = ({ children, value: block }) => (
    <Heading
      level={2}
      visual="prose-h2"
      id={headingId(block._key)}
      className={headingClassName(block._key)}
    >
      {children}
    </Heading>
  );

  const H3: PortableTextBlockComponent = ({ children, value: block }) => (
    <Heading
      level={3}
      visual="prose-h3"
      id={headingId(block._key)}
      className={headingClassName(block._key)}
    >
      {children}
    </Heading>
  );

  return { h2: H2, h3: H3 };
};

/**
 * PortableTextRenderer — web-owned bridge from a Sanity Portable Text field
 * to rendered markup, via `@portabletext/react`. Maps block styles and marks
 * to `@blog/ui` atoms, a `code` block to a syntax-highlighted `CodeBlock`,
 * and a `bodyImage` block to `SanityImage` wrapped in `ImageWithCaption`
 * (carrying the editor-chosen `layout`), keeping `@blog/ui` itself
 * Sanity-free. Optionally stamps `h2`/`h3` headings with stable anchor ids
 * via `headings`, for use with `PostContentsRail`.
 *
 * @example
 * <ContentModule title={title}>
 *   <PortableTextRenderer value={body} baseUrl={baseUrl} />
 * </ContentModule>
 *
 * @example
 * <PortableTextRenderer value={body} baseUrl={baseUrl} headings={extractPostHeadings(body)} />
 */
export const PortableTextRenderer = ({
  value,
  baseUrl,
  headings,
  asideKindLabels,
}: IPortableTextRendererProps) => {
  const renderBodyImage = (imageValue: BodyImage) => {
    const image = toPortableTextImage(imageValue, baseUrl);
    if (!image) return null;

    return (
      <ImageWithCaption layout={imageValue.layout}>
        <SanityImage
          image={image}
          width={1200}
          sizes="(min-width: 1024px) 800px, 100vw"
          loading="lazy"
          className={s.image()}
        />
      </ImageWithCaption>
    );
  };

  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => <p>{children}</p>,
      // Defensive downgrade to h2 treatment: a document can still carry a
      // legacy 'h1' block even though Studio no longer offers it.
      h1: ({ children }) => (
        <Heading level={2} visual="prose-h2">
          {children}
        </Heading>
      ),
      ...headingBlockComponents(headings ?? []),
      h4: ({ children }) => (
        <Heading level={4} visual="prose-h4">
          {children}
        </Heading>
      ),
      blockquote: ({ children }) => <QuoteBlock>{children}</QuoteBlock>,
    },
    marks: {
      code: ({ children }: PortableTextMarkComponentProps) => (
        <InlineCode>{children}</InlineCode>
      ),
      link: ({
        children,
        value: annotation,
      }: PortableTextMarkComponentProps<ILinkAnnotation>) =>
        annotation?.href ? (
          <ProseLink as={SmartLink} href={annotation.href}>
            {children}
          </ProseLink>
        ) : (
          <>{children}</>
        ),
    },
    types: {
      code: ({ value: codeValue }: { value: Code }) => (
        <CodeBlock
          code={codeValue.code ?? ''}
          language={codeValue.language}
          filename={codeValue.filename}
          highlightedLines={codeValue.highlightedLines}
        />
      ),
      bodyImage: ({ value: imageValue }: { value: BodyImage }) =>
        renderBodyImage(imageValue),
      // Unknown/missing `kind` renders as CONTEXT — forward-compat with a
      // future `ASIDE_KIND` value this renderer doesn't know about.
      aside: ({ value: asideValue }: { value: TAsideBlock }) => {
        const kind = asideValue.kind ?? ASIDE_KIND.CONTEXT;
        const label = asideKindLabels?.[kind] ?? kind;

        return (
          <DeepAside kind={kind} label={label}>
            <PortableText
              value={asideValue.body ?? []}
              components={components}
            />
          </DeepAside>
        );
      },
    },
  };

  const segments = segmentPortableTextBody(value);
  const hasBreakout = segments.some((segment) => segment.kind === 'BREAKOUT');

  // Common case: skip the segment loop so the DOM stays identical to before FULL_BLEED support was added.
  if (!hasBreakout) {
    return (
      <Prose className={s.root()}>
        <PortableText value={value} components={components} />
      </Prose>
    );
  }

  // At least one `FULL_BLEED` image: each `PROSE` run keeps its own
  // `Prose` wrapper (reading-measure width), rendered as a sibling of the
  // breakout image rather than nesting the image inside it — that's what
  // lets the image fill the full "breakout-safe" width of `content`
  // (`blog-post-page-variants.ts`) instead of being capped to the measure.
  return (
    <div className={s.segments()}>
      {segments.map((segment, index) =>
        segment.kind === 'PROSE' ? (
          <Prose key={`prose-${index}`} className={s.root()}>
            <PortableText value={segment.blocks} components={components} />
          </Prose>
        ) : (
          <Fragment key={segment.block._key}>
            {renderBodyImage(segment.block)}
          </Fragment>
        ),
      )}
    </div>
  );
};
