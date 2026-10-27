import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { screen } from '@web/testing/custom-render';

export const readJsonLd = () =>
  screen
    .getAllByTestId(JSON_LD_SCRIPT_TEST_ID)
    .map((script) => script.textContent)
    .join('\n');
