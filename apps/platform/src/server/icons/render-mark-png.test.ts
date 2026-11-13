import { SHINEFOLD_LOGO_COLOR } from '@blog/utils/shinefold-logo';

import { renderMarkPng } from './render-mark-png';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];
const MOCK_SIDE = 16;

describe(renderMarkPng, () => {
  it.each([
    { ground: 'transparent', background: undefined },
    { ground: 'filled', background: SHINEFOLD_LOGO_COLOR.YELLOW },
  ])('renders a $ground mark to a PNG', async ({ background }) => {
    const response = renderMarkPng(MOCK_SIDE, background);
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect([...bytes.slice(0, PNG_SIGNATURE.length)]).toEqual(PNG_SIGNATURE);
  });
});
