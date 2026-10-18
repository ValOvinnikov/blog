import {
  CONTRAST_STATUS,
  RELEASE_RUN_STATUS,
  type TContrastStatus,
  type TReleaseRunStatus,
} from '@platform/constants/release';

const UNCHECKED_CONTRAST_STATUSES: readonly TContrastStatus[] = [
  CONTRAST_STATUS.DUE,
  CONTRAST_STATUS.FAILED,
  CONTRAST_STATUS.RUNNING,
];

type TReleaseOverrideInput = {
  isRenderingChanged: boolean;
  contrastStatus: TContrastStatus;
};

export const isReleaseOverrideRequired = ({
  isRenderingChanged,
  contrastStatus,
}: TReleaseOverrideInput): boolean =>
  isRenderingChanged && UNCHECKED_CONTRAST_STATUSES.includes(contrastStatus);

export const isReleaseRunActive = (status: TReleaseRunStatus): boolean =>
  status === RELEASE_RUN_STATUS.DISPATCHED ||
  status === RELEASE_RUN_STATUS.RUNNING;
