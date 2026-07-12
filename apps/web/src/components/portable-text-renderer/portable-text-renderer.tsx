import type { RichText as TPortableText } from '@blog/config';
import { PortableText } from '@portabletext/react';

export interface IPortableTextRendererProps {
  value: TPortableText;
}

/**
 * PortableTextRenderer — web-owned bridge from a Sanity Portable Text field
 * (the service layer's `PortableText` view-model type) to rendered markup,
 * via `@portabletext/react`. Maps blocks to semantic HTML using the
 * library's sensible defaults; custom block types (e.g. code blocks) get
 * their own `components` override here as they're introduced.
 *
 * @example
 * <ContentModule title={title}>
 *   <PortableTextRenderer value={body} />
 * </ContentModule>
 */
export const PortableTextRenderer = ({ value }: IPortableTextRendererProps) => (
  <PortableText value={value} />
);
