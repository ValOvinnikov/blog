import { Eye } from 'lucide-react';
import type { DocumentActionComponent } from 'sanity';

// A full navigation: the preview route's frame policy is a response header a client-side route change never receives.
export const createPreviewAction = (
  previewBasePath: string,
): DocumentActionComponent => {
  const PreviewAction: DocumentActionComponent = ({
    id,
    draft,
    published,
  }) => ({
    label: 'Preview',
    icon: Eye,
    disabled: !draft && !published,
    onHandle: () => {
      window.open(
        `${previewBasePath}/${encodeURIComponent(id)}`,
        '_blank',
        'noopener',
      );
    },
  });

  PreviewAction.displayName = 'PreviewAction';

  return PreviewAction;
};
