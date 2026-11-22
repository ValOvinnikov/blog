import { useToast } from '@sanity/ui/toast';
import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import { applyLandingRedirects } from '@shinefold/studio/document-actions/apply-landing-redirects/apply-landing-redirects';
import { STUDIO_API_VERSION } from '@shinefold/studio/studio-api-version';
import { type DocumentActionComponent, useClient } from 'sanity';

const wrapped = new WeakMap<DocumentActionComponent, DocumentActionComponent>();

export const withLandingRedirects = (
  publish: DocumentActionComponent,
): DocumentActionComponent => {
  const cached = wrapped.get(publish);
  if (cached) return cached;

  const LandingPublishAction: DocumentActionComponent = (props) => {
    const description = publish(props);
    const client = useClient({ apiVersion: STUDIO_API_VERSION });
    const toast = useToast();
    const { draft } = props;

    if (!description || !draft) return description;

    return {
      ...description,
      onHandle: async () => {
        try {
          await applyLandingRedirects(
            client.withConfig({ perspective: SANITY_PERSPECTIVE.PUBLISHED }),
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
