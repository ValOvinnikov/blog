import { applyLandingRedirects } from '@blog/studio/document-actions/apply-landing-redirects/apply-landing-redirects';
import { useToast } from '@sanity/ui/toast';
import { type DocumentActionComponent, useClient } from 'sanity';

const REDIRECTS_API_VERSION = '2025-02-19';

const wrapped = new WeakMap<DocumentActionComponent, DocumentActionComponent>();

export const withLandingRedirects = (
  publish: DocumentActionComponent,
): DocumentActionComponent => {
  const cached = wrapped.get(publish);
  if (cached) return cached;

  const LandingPublishAction: DocumentActionComponent = (props) => {
    const description = publish(props);
    const client = useClient({ apiVersion: REDIRECTS_API_VERSION });
    const toast = useToast();
    const { draft } = props;

    if (!description || !draft) return description;

    return {
      ...description,
      onHandle: async () => {
        try {
          await applyLandingRedirects(
            client.withConfig({ perspective: 'published' }),
            draft,
          );
        } catch {
          toast.push({
            status: 'error',
            title: 'Not published',
            description:
              'The redirect from this page’s old address could not be saved. Try publishing again.',
          });
          return;
        }

        description.onHandle?.();
      },
    };
  };

  LandingPublishAction.action = publish.action;
  LandingPublishAction.displayName = 'LandingPublishAction';
  wrapped.set(publish, LandingPublishAction);

  return LandingPublishAction;
};
