import { TransferStateCodeEnum } from './transfer-state-code.enum';

describe('TransferStateCodeEnum', () => {
  it('should have STARTED code as 600', () => {
    expect(TransferStateCodeEnum.STARTED).toBe('600');
  });

  it('should have TERMINATED code as 850', () => {
    expect(TransferStateCodeEnum.TERMINATED).toBe('850');
  });

  it('should have COMPLETED code as 800', () => {
    expect(TransferStateCodeEnum.COMPLETED).toBe('800');
  });

  it('should have exactly 3 enum values', () => {
    const values = Object.values(TransferStateCodeEnum);
    expect(values.length).toBe(3);
  });

  it('should have all expected keys', () => {
    const keys = Object.keys(TransferStateCodeEnum);
    expect(keys).toContain('STARTED');
    expect(keys).toContain('TERMINATED');
    expect(keys).toContain('COMPLETED');
  });
});
