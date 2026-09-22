import {
  ASIDE_KIND,
  IMAGE_LAYOUT,
  type Code,
  type IBodyImageBlock,
  type TAsideKind,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { ImageWithCaption } from '@blog/ui/molecules/image-with-caption';
import {
  PortableText as PortableTextRoot,
  type PortableTextReactComponents,
} from '@portabletext/react';
import { DeepAside } from '@web/components/shared/deep-aside';
import { SanityImage } from '@web/components/shared/sanity-image';

import { CodeBlock } from '../components/code-block';
import { portableTextVariants } from '../portable-text-variants';

const s = portableTextVariants();

export type TAsideKindLabels = Partial<Record<TAsideKind, string>>;

type TResolvedAsideBlock = Extract<
  TPortableTextBody[number],
  { _type: 'aside' }
>;

const renderBodyImage = (block: IBodyImageBlock) => {
  if (!block.image) return null;

  const image = (
    <ImageWithCaption layout={block.layout}>
      <SanityImage
        image={block.image}
        width={1200}
        sizes="(min-width: 1024px) 800px, 100vw"
        loading="lazy"
        className={s.image()}
      />
    </ImageWithCaption>
  );

  // `data-full-bleed` is the hook a caller's own measure-cap selector
  // (e.g. `post-article-variants.ts`'s `prose` slot) excludes from the
  // text measure, so this wrapper's `ImageWithCaption` can reach its own
  // `FULL_BLEED` breakout width instead of being capped to the text column.
  return block.layout === IMAGE_LAYOUT.FULL_BLEED ? (
    <div data-full-bleed="">{image}</div>
  ) : (
    image
  );
};

export const bodyImageTypeComponent = ({ value }: { value: IBodyImageBlock }) =>
  renderBodyImage(value);

export const codeTypeComponent = ({ value }: { value: Code }) => (
  <CodeBlock
    code={value.code ?? ''}
    language={value.language}
    filename={value.filename}
    highlightedLines={value.highlightedLines}
  />
);

export const makeAsideTypeComponent = (
  baseComponents: PortableTextReactComponents,
  asideKindLabels?: TAsideKindLabels,
) => {
  const AsideType = ({ value }: { value: TResolvedAsideBlock }) => {
    const kind = value.kind ?? ASIDE_KIND.CONTEXT;
    const label = asideKindLabels?.[kind] ?? kind;

    return (
      <DeepAside kind={kind} label={label}>
        <PortableTextRoot
          value={value.body ?? []}
          components={baseComponents}
        />
      </DeepAside>
    );
  };

  return AsideType;
};
