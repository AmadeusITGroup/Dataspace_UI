import { AssetPrivateProperties } from './assetPrivateProperties';
import { AssetProperties } from './assetProperties';
import { DataAddress } from './dataAddress';

export interface Asset {
  '@id': string;
  '@type'?: string;
  createdAt?: number;
  dataAddress: DataAddress;
  privateProperties?: AssetPrivateProperties;
  properties: AssetProperties;
}
