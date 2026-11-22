import { Box, Button, Stack, Text } from '@sanity/ui';
import { useToast } from '@sanity/ui/toast';
import {
  isOutcomeSuccess,
  type TNewsletterSendNowEligibility,
} from '@shinefold/config';
import {
  sendNewsletterPostNow,
  type TNewsletterPostRef,
} from '@shinefold/studio/platform-routes/newsletter-post-send/newsletter-post-send';
import { SendEmailsDialog } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-emails-dialog';
import {
  SEND_EMAILS_LABEL,
  SEND_NOW_REFUSED_TOAST,
  sendNowDisabledReason,
  sendNowStartedToast,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-now-copy';
import { isUndefined } from '@shinefold/utils/primitives';
import { useState } from 'react';

type TSendEmailsButtonProps = {
  post: TNewsletterPostRef;
  confirmedCount: number;
  eligibility: Extract<TNewsletterSendNowEligibility, { isOffered: true }>;
  onSettled: () => void;
};

export const SendEmailsButton = ({
  post,
  confirmedCount,
  eligibility,
  onSettled,
}: TSendEmailsButtonProps) => {
  const toast = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const disabledReason = sendNowDisabledReason(eligibility);
  const emailsLeft = eligibility.disabledBy
    ? undefined
    : eligibility.emailsLeft;

  const closeDialog = () => {
    setIsConfirming(false);
  };

  const sendNow = async () => {
    setIsSending(true);
    const result = await sendNewsletterPostNow(post);
    setIsSending(false);
    setIsConfirming(false);
    toast.push(
      isOutcomeSuccess(result)
        ? { status: 'success', title: sendNowStartedToast(confirmedCount) }
        : { status: 'error', title: SEND_NOW_REFUSED_TOAST },
    );
    onSettled();
  };

  return (
    <Stack gap={2}>
      <Box>
        <Button
          mode="ghost"
          text={SEND_EMAILS_LABEL}
          disabled={Boolean(disabledReason)}
          onClick={() => {
            setIsConfirming(true);
          }}
        />
      </Box>
      {disabledReason && (
        <Text size={1} muted={true}>
          {disabledReason}
        </Text>
      )}
      {isConfirming && !isUndefined(emailsLeft) && (
        <SendEmailsDialog
          confirmedCount={confirmedCount}
          emailsLeft={emailsLeft}
          isSending={isSending}
          onCancel={closeDialog}
          onConfirm={() => {
            void sendNow();
          }}
        />
      )}
    </Stack>
  );
};
