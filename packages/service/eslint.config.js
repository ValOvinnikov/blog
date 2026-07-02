import config from '@blog/config/eslint';
import { namingConventionConfig } from '@blog/config/eslint/naming';
import { fileNamingConfig } from '@blog/config/eslint/file-naming';
export default [...config, ...namingConventionConfig, ...fileNamingConfig];
