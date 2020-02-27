import configureEightBase from './configureEightBase';
import Api from '@8base-js-sdk/api';
import Auth from '@8base-js-sdk/auth';

const eightBase = {
  configure: configureEightBase,
};

export default eightBase;
export { Api, Auth };
export * from './types';
export * from '@8base-js-sdk/api';
export * from '@8base-js-sdk/auth';
