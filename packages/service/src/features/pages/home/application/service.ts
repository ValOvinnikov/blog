import { getHomePage } from '../adaptor/loader';

export function createHomeService() {
  return {
    v1: { getHomePage },
  };
}
