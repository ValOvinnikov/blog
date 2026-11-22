import { Spinner, Stack } from '@sanity/ui';
import { PAGE_POST_TYPE } from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { SendEmailsButton } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-emails-button';
import { SendStatusCard } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-card';
import { toSendStatusView } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-status-view';
import {
  isSendFieldHidden,
  toSendSwitchView,
} from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/send-switch-view';
import { useNewsletterPostSendStatus } from '@shinefold/studio/schema-types/inputs/send-to-subscribers-field/use-newsletter-post-send-status';
import { isString } from '@shinefold/utils/primitives';
import {
  type BooleanFieldProps,
  FormField,
  getPublishedId,
  useEditState,
  useFormValue,
  useProjectId,
} from 'sanity';

type TPostSendFieldProps = BooleanFieldProps & { postId: string };

const PostSendField = ({ postId, ...props }: TPostSendFieldProps) => {
  const projectId = useProjectId();
  const { published } = useEditState(postId, PAGE_POST_TYPE);
  const post = { projectId, postId, isPublished: Boolean(published) };
  const { isLoading, status, refresh } = useNewsletterPostSendStatus(
    post,
    published?._rev,
  );
  const { title, inputId, path, level, validation, inputProps } = props;

  if (!status) {
    return isLoading ? (
      <FormField title={title} inputId={inputId} path={path} level={level}>
        <Spinner muted={true} />
      </FormField>
    ) : (
      props.renderDefault(props)
    );
  }
  if (isSendFieldHidden(status)) return null;

  const { confirmedCount, sendNow } = status;
  const sendEmails = sendNow.isOffered && (
    <SendEmailsButton
      post={post}
      confirmedCount={confirmedCount}
      eligibility={sendNow}
      onSettled={refresh}
    />
  );
  const statusView = toSendStatusView(status);

  if (statusView) {
    return (
      <FormField
        title={title}
        inputId={inputId}
        path={path}
        level={level}
        validation={validation}
      >
        <Stack gap={3}>
          <SendStatusCard view={statusView} />
          {sendEmails}
        </Stack>
      </FormField>
    );
  }

  const { isDisabled, description } = toSendSwitchView(status);
  return (
    <Stack gap={3}>
      {props.renderDefault({
        ...props,
        description,
        inputProps: {
          ...inputProps,
          readOnly: isDisabled || inputProps.readOnly,
        },
      })}
      {sendEmails}
    </Stack>
  );
};

export const SendToSubscribersField = (props: BooleanFieldProps) => {
  const documentId = useFormValue(['_id']);

  return isString(documentId) ? (
    <PostSendField {...props} postId={getPublishedId(documentId)} />
  ) : (
    props.renderDefault(props)
  );
};
