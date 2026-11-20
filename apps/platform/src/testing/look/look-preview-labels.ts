import messages from '@platform/i18n/messages/en.json';
import { makeEnTranslator } from '@platform/testing/en-translator';

export const tDevicePreview = makeEnTranslator('devicePreview');
export const PREVIEW_TABLET_LABEL = tDevicePreview('deviceTablet');
export const PREVIEW_DARK_LABEL = messages.previewModeControl.modeDark;
