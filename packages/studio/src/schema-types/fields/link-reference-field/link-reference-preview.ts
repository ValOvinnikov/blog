type TLinkReferencePreviewValue = { title?: unknown; label?: unknown };

export const linkReferencePreviewSelect = {
  title: 'link.title',
  label: 'link.label.0.value',
};

export const toLinkReferencePreviewTitle = ({
  title,
  label,
}: TLinkReferencePreviewValue) => String(title ?? label ?? 'No link selected');
