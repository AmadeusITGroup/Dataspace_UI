import { Action } from './action';
import { BasePolicy } from './constraint';
import { Duty } from './duty';

export interface Prohibition extends BasePolicy {
  action?: Action | string;
  remedies?: Duty[];
}
