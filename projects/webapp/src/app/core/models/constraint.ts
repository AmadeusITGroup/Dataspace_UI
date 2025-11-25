export type Constraint = AtomicConstraint | MultiplicityConstraint;

export interface AtomicConstraint {
  leftOperand: string;
  operator: string;
  rightOperand: string;
}

export interface MultiplicityConstraint {
  '@type': string;
  constraint: Constraint[];
}

export interface BasePolicy {
  assignee?: string;
  assigner?: string;
  target?: string;
  uid?: string;
  constraint?: Constraint[];
}
