import { ContractRoleEnum } from './role.enum';

describe('ContractRoleEnum', () => {
  it('should have PROVIDER value', () => {
    expect(ContractRoleEnum.PROVIDER).toBe('PROVIDER');
  });

  it('should have CONSUMER value', () => {
    expect(ContractRoleEnum.CONSUMER).toBe('CONSUMER');
  });

  it('should have exactly 2 enum values', () => {
    const values = Object.values(ContractRoleEnum);
    expect(values.length).toBe(2);
  });

  it('should have all expected keys', () => {
    const keys = Object.keys(ContractRoleEnum);
    expect(keys).toContain('PROVIDER');
    expect(keys).toContain('CONSUMER');
  });
});
