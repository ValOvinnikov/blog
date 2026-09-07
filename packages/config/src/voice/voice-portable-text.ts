export type TVoicePortableTextSpan = {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[];
};

export type TVoicePortableTextLink = {
  _type: 'link';
  _key: string;
  href: string;
};

export type TVoicePortableTextBlock = {
  _type: 'block';
  _key: string;
  style: 'normal';
  children: TVoicePortableTextSpan[];
  markDefs?: TVoicePortableTextLink[];
};

/** A Voice rich-text field's stored shape — Portable Text restricted to bold, italic, link and plain paragraphs. */
export type TVoicePortableText = TVoicePortableTextBlock[];
