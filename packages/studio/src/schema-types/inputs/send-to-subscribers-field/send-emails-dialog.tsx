import { Box, Button, Dialog, Flex, Text } from '@sanity/ui';
import {
  CANCEL_LABEL,
  SEND_EMAILS_LABEL,
  sendNowConfirmCopy,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-now-copy';
import { useEffect, useId, useRef } from 'react';

type TSendEmailsDialogProps = {
  confirmedCount: number;
  emailsLeft: number;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const SendEmailsDialog = ({
  confirmedCount,
  emailsLeft,
  isSending,
  onCancel,
  onConfirm,
}: TSendEmailsDialogProps) => {
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { title, body } = sendNowConfirmCopy(confirmedCount, emailsLeft);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <Dialog
      id={id}
      header={title}
      width={1}
      onClose={onCancel}
      __unstable_autoFocus={false}
      footer={
        <Flex gap={2} justify="flex-end" padding={3}>
          <Button
            ref={cancelRef}
            mode="ghost"
            text={CANCEL_LABEL}
            disabled={isSending}
            onClick={onCancel}
          />
          <Button
            tone="primary"
            text={SEND_EMAILS_LABEL}
            loading={isSending}
            onClick={onConfirm}
          />
        </Flex>
      }
    >
      <Box padding={4}>
        <Text size={1}>{body}</Text>
      </Box>
    </Dialog>
  );
};
