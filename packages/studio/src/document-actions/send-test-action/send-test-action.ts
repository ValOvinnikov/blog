import { useToast } from '@sanity/ui/toast';
import {
  NEWSLETTER_POST_EMAIL_PROJECTION,
  type TLocaleIsoCode,
  type TRawNewsletterPostEmail,
  toNewsletterPostEmail,
} from '@shinefold/config';
import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  SEND_TEST_FAILED_TOAST,
  toSendTestToast,
} from '@shinefold/studio/document-actions/send-test-action/send-test-toast';
import {
  sendNewsletterPostTest,
  type TNewsletterPostTest,
} from '@shinefold/studio/platform-routes/newsletter-post-send/newsletter-post-send';
import { STUDIO_API_VERSION } from '@shinefold/studio/studio-api-version';
import { Send } from 'lucide-react';
import { useState } from 'react';
import {
  type DocumentActionComponent,
  useClient,
  useCurrentUser,
  useProjectId,
} from 'sanity';

type TRawPostTest = TRawNewsletterPostEmail & { language?: TLocaleIsoCode };

const SAVED_POST_QUERY = `*[_id == $id][0]{ ${NEWSLETTER_POST_EMAIL_PROJECTION}, language }`;

const toPostTest = (
  raw: TMaybeNull<TRawPostTest>,
  projectId: string,
): TMaybeUndefined<TNewsletterPostTest> => {
  const email = raw && toNewsletterPostEmail(raw);
  if (!email || !raw.language) return undefined;
  const { summary, ...fields } = email;
  return { ...fields, projectId, takeaways: summary, locale: raw.language };
};

export const SendTestAction: DocumentActionComponent = ({
  draft,
  published,
}) => {
  const client = useClient({ apiVersion: STUDIO_API_VERSION });
  const projectId = useProjectId();
  const currentUser = useCurrentUser();
  const toast = useToast();
  const [isSending, setIsSending] = useState(false);
  const savedId = (draft ?? published)?._id;

  const sendTest = async (id: string, email: string) => {
    setIsSending(true);
    try {
      const raw = await client
        .withConfig({ perspective: SANITY_PERSPECTIVE.RAW })
        .fetch<TMaybeNull<TRawPostTest>>(SAVED_POST_QUERY, { id });
      const test = toPostTest(raw, projectId);
      toast.push(
        test
          ? toSendTestToast(await sendNewsletterPostTest(test), email)
          : SEND_TEST_FAILED_TOAST,
      );
    } catch {
      toast.push(SEND_TEST_FAILED_TOAST);
    } finally {
      setIsSending(false);
    }
  };

  return {
    label: 'Send me a test',
    title: 'Emails this post to you only',
    icon: Send,
    disabled: !savedId || !currentUser || isSending,
    onHandle: () => {
      if (savedId && currentUser) void sendTest(savedId, currentUser.email);
    },
  };
};

SendTestAction.displayName = 'SendTestAction';
