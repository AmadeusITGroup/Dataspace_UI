import { Duty } from './duty';
import { Permission } from './permission';
import { Prohibition } from './prohibition';

export interface PolicyCondition {
  'odrl:obligation': Duty[];
  'odrl:permission': Permission[];
  'odrl:prohibition': Prohibition[];
}
