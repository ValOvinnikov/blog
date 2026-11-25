interface ILinkedParagraphText {
  lead?: string;
  link: string;
  tail?: string;
}

export function linkedParagraph<
  TMarkDef extends { _type: string; _key: string },
>(key: string, markDef: TMarkDef, { lead, link, tail }: ILinkedParagraphText) {
  const span = (spanKey: string, text: string, marks: string[] = []) => ({
    _type: 'span' as const,
    _key: spanKey,
    text,
    marks,
  });

  return {
    _type: 'block' as const,
    _key: key,
    style: 'normal' as const,
    markDefs: [markDef],
    children: [
      ...(lead ? [span('lead', lead)] : []),
      span('link', link, [markDef._key]),
      ...(tail ? [span('tail', tail)] : []),
    ],
  };
}
