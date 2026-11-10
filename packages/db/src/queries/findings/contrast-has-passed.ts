import { CONTRAST_CHECK_OUTCOME } from '@blog/config/constants';
import { findings } from '@blog/db/schema/findings';
import { sql } from 'drizzle-orm';

// A failure a pass on another SHA superseded is RESOLVED too, so only the
// row's own outcome says whether its commit passed.
export const contrastHasPassed =
  sql<boolean>`coalesce(${findings.details}->>'outcome' = ${CONTRAST_CHECK_OUTCOME.PASS}, false)`.mapWith(
    Boolean,
  );
