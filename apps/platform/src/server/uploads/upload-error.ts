import type { TUploadRefusal } from '@platform/constants/upload';
import type {
  ACTION_OUTCOME,
  TActionResult,
  TOutcome,
} from '@shinefold/config';

export type TClearUploadResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  TUploadRefusal
>;

export type TUploadFailure = Exclude<
  TClearUploadResult,
  TOutcome<typeof ACTION_OUTCOME.SUCCESS>
>;

export type TUploadResult =
  { outcome: typeof ACTION_OUTCOME.SUCCESS; url: string } | TUploadFailure;
