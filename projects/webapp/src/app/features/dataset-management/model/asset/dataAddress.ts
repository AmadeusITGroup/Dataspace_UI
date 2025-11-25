import { BaseAuth } from './baseAuth';
import { Oauth2 } from './oauth2';

export interface BaseDataAddress {
  '@type'?: string;
  type: string;
  baseUrl: string;
  path?: string;
  queryParams?: string;
  proxyPath: string;
  proxyQueryParams: string;
}

export type BaseDataHeaders = Record<`header${string}`, string>;

export type DataAddress = BaseDataAddress & BaseDataHeaders & (BaseAuth & Oauth2);
