export type TPortableTextSpan = {
  _type?: string;
  text?: string;
  marks?: string[];
};

export type TPortableTextMarkDef = {
  _key: string;
  _type?: string;
  href?: string;
};

export type TPortableTextBlock = {
  _type: 'block';
  style?: string;
  listItem?: string;
  children?: TPortableTextSpan[];
  markDefs?: TPortableTextMarkDef[];
};

export type TPortableTextNode = { _type: string } & Record<string, unknown>;

export type TPortableTextContent = TPortableTextNode[] | null | undefined;
