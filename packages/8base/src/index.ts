import configureEightBase from './configureEightBase';
import Api from '@8base-js-sdk/api';
import Auth from '@8base-js-sdk/auth';

// @ts-ignore
const EightBase = {
  configure: configureEightBase,
};

export default EightBase;
export { Api, Auth };
export * from './types';
export * from '@8base-js-sdk/api';
export * from '@8base-js-sdk/auth';
