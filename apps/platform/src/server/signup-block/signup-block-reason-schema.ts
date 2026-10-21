import { SIGNUP_BLOCK_REASON_MAX_LENGTH } from '@platform/constants/signup-block';
import { z } from 'zod';

export const signupBlockReasonSchema = z
  .string()
  .trim()
  .min(1)
  .max(SIGNUP_BLOCK_REASON_MAX_LENGTH);
