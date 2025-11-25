import { Permission } from './permission';
import { Action } from './action';
import { BasePolicy } from './constraint';

export interface Duty extends BasePolicy {
  consequence?: Duty;
  parentPermission?: Permission;
  action: Action | string;
}
