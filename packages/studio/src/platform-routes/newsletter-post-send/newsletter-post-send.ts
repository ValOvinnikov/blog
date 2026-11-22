import {
  ACTION_OUTCOME,
  HTTP_METHOD,
  isOutcomeSuccess,
  MEDIA_TYPE,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_TEST_SEND_REFUSAL,
  REQUEST_HEADER,
  routes,
  type TLocaleIsoCode,
  type TNewsletterPostEmail,
  type TNewsletterPostSendStatus,
  type TNewsletterPostSendStatusResponse,
  type TNewsletterSendNowResult,
  type TNewsletterTestSendResult,
} from '@shinefold/config';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';

export type TNewsletterPostRef = {
  projectId: string;
  postId: string;
  isPublished: boolean;
};

export type TNewsletterPostTest = Omit<TNewsletterPostEmail, 'summary'> & {
  projectId: string;
  takeaways: TNewsletterPostEmail['summary'];
  locale: TLocaleIsoCode;
};

const SEND_NOW_FAILED: TNewsletterSendNowResult = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
};

const TEST_SEND_FAILED: TNewsletterTestSendResult = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: NEWSLETTER_TEST_SEND_REFUSAL.SEND_FAILED,
};

// A route that fails outright answers with a `null` body, which reads as no result.
const requestJson = async <T>(
  path: string,
  init?: RequestInit,
): Promise<TMaybeUndefined<T>> => {
  try {
    const response = await fetch(path, init);
    return ((await response.json()) as TMaybeNull<T>) ?? undefined;
  } catch {
    return undefined;
  }
};

const postJson = <T>(path: string, body: object) =>
  requestJson<T>(path, {
    method: HTTP_METHOD.POST,
    headers: { [REQUEST_HEADER.CONTENT_TYPE]: MEDIA_TYPE.JSON },
    body: JSON.stringify(body),
  });

export const readNewsletterPostSendStatus = async ({
  projectId,
  postId,
  isPublished,
}: TNewsletterPostRef): Promise<TMaybeUndefined<TNewsletterPostSendStatus>> => {
  const query = new URLSearchParams({
    projectId,
    postId,
    isPublished: String(isPublished),
  });
  const result = await requestJson<TNewsletterPostSendStatusResponse>(
    `${routes.newsletterPostSendStatus()}?${query.toString()}`,
  );
  return result && isOutcomeSuccess(result) ? result : undefined;
};

export const sendNewsletterPostNow = async (
  post: TNewsletterPostRef,
): Promise<TNewsletterSendNowResult> =>
  (await postJson<TNewsletterSendNowResult>(
    routes.newsletterPostSendNow(),
    post,
  )) ?? SEND_NOW_FAILED;

export const sendNewsletterPostTest = async (
  test: TNewsletterPostTest,
): Promise<TNewsletterTestSendResult> =>
  (await postJson<TNewsletterTestSendResult>(
    routes.newsletterPostTestSend(),
    test,
  )) ?? TEST_SEND_FAILED;
