import { TransferStateEnum } from './transfer-state.enum';

describe('TransferStateEnum', () => {
  it('should have INITIAL state', () => {
    expect(TransferStateEnum.INITIAL).toBe('INITIALIZED');
  });

  it('should have PROVISIONING state', () => {
    expect(TransferStateEnum.PROVISIONING).toBe('PROVISIONING');
  });

  it('should have PROVISIONING_REQUESTED state', () => {
    expect(TransferStateEnum.PROVISIONING_REQUESTED).toBe('PROVISIONING REQUESTED');
  });

  it('should have PROVISIONED state', () => {
    expect(TransferStateEnum.PROVISIONED).toBe('PROVISIONED');
  });

  it('should have REQUESTING state', () => {
    expect(TransferStateEnum.REQUESTING).toBe('REQUESTING');
  });

  it('should have REQUESTED state', () => {
    expect(TransferStateEnum.REQUESTED).toBe('REQUESTED');
  });

  it('should have STARTING state', () => {
    expect(TransferStateEnum.STARTING).toBe('STARTING');
  });

  it('should have STARTED state', () => {
    expect(TransferStateEnum.STARTED).toBe('STARTED');
  });

  it('should have SUSPENDING state', () => {
    expect(TransferStateEnum.SUSPENDING).toBe('SUSPENDING');
  });

  it('should have SUSPENDING_REQUESTED state', () => {
    expect(TransferStateEnum.SUSPENDING_REQUESTED).toBe('SUSPENDING REQUESTED');
  });

  it('should have SUSPENDED state', () => {
    expect(TransferStateEnum.SUSPENDED).toBe('SUSPENDED');
  });

  it('should have RESUMING state', () => {
    expect(TransferStateEnum.RESUMING).toBe('RESUMING');
  });

  it('should have RESUMED state', () => {
    expect(TransferStateEnum.RESUMED).toBe('RESUMED');
  });

  it('should have COMPLETING state', () => {
    expect(TransferStateEnum.COMPLETING).toBe('COMPLETING');
  });

  it('should have COMPLETING_REQUESTED state', () => {
    expect(TransferStateEnum.COMPLETING_REQUESTED).toBe('COMPLETING REQUESTED');
  });

  it('should have COMPLETED state', () => {
    expect(TransferStateEnum.COMPLETED).toBe('COMPLETED');
  });

  it('should have TERMINATING state', () => {
    expect(TransferStateEnum.TERMINATING).toBe('TERMINATING');
  });

  it('should have TERMINATING_REQUESTED state', () => {
    expect(TransferStateEnum.TERMINATING_REQUESTED).toBe('TERMINATING REQUESTED');
  });

  it('should have TERMINATED state', () => {
    expect(TransferStateEnum.TERMINATED).toBe('TERMINATED');
  });

  it('should have DEPROVISIONING state', () => {
    expect(TransferStateEnum.DEPROVISIONING).toBe('DEPROVISIONING');
  });

  it('should have DEPROVISIONING_REQUESTED state', () => {
    expect(TransferStateEnum.DEPROVISIONING_REQUESTED).toBe('DEPROVISIONING REQUESTED');
  });

  it('should have DEPROVISIONED state', () => {
    expect(TransferStateEnum.DEPROVISIONED).toBe('DEPROVISIONED');
  });

  it('should have exactly 22 enum values', () => {
    const values = Object.values(TransferStateEnum);
    expect(values.length).toBe(22);
  });
});
