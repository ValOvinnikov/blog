import { z } from 'zod';

export const SHOW_IMAGES_EXPRESSION = 'coalesce(showImages, true)';

export const showImagesParser = z.boolean();
