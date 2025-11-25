import { Duty } from './duty';
import { Action } from './action';
import { BasePolicy } from './constraint';

export interface Permission extends BasePolicy {
  duties?: Duty[];
  action: Action | string;
}
