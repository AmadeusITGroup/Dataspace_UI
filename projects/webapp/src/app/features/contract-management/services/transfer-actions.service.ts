import { inject, Injectable } from '@angular/core';
import { TransferService } from './contract-transfer.service';
import { ConfirmationModalService } from '../../../shared/components/confirmation-modal/confirmation-modal.service';
import { ContractRoleEnum } from '../constants/role.enum';
import { ACTIONS } from '../utils/contract-transfer.util';
import { TransferStateEnum } from '../constants/transfer-state.enum';

@Injectable()
export class TransferActionsService {
  public transferService = inject(TransferService);
  public confirmationModalService = inject(ConfirmationModalService);

  suspend(transferProcessId: string | undefined, role: string) {
    if (!transferProcessId) return;
    return this.confirmationModalService
      .showConfirmationModalWithReason(
        `Suspend transfer ${transferProcessId}`,
        'Are you sure you want to Suspend this transfer?'
      )
      .then((result) => {
        if (result) {
          const reasonWithRole =
            role === ContractRoleEnum.PROVIDER
              ? `Provider note: ${result || 'Suspended by provider'}`
              : `Consumer note: ${result || 'Suspended by consumer'}`;
          this.transferService.suspendTransfer.mutate(
            { transferProcessId, reason: reasonWithRole },
            { onSuccess: () => this.transferService.enableRefresh(transferProcessId) }
          );
        }
      });
  }

  resume(transferProcessId: string | undefined) {
    if (!transferProcessId) return;
    this.transferService.resumeTransfer.mutate(transferProcessId, {
      onSuccess: () => this.transferService.enableRefresh(transferProcessId)
    });
  }

  deprovision(transferProcessId: string | undefined) {
    if (!transferProcessId) return;
    return this.confirmationModalService
      .showDefaultConfirmationModal(
        `De-provision transfer ${transferProcessId}`,
        'Deprovisioning a transfer is irreversible. Are you sure you want to de-provision this transfer?'
      )
      .then((result) => {
        if (result) {
          this.transferService.deprovisionTransfer.mutate(transferProcessId, {
            onSuccess: () => this.transferService.enableRefresh(transferProcessId)
          });
        }
      });
  }

  terminate(transferProcessId: string | undefined, role: string) {
    if (!transferProcessId) return;
    return this.confirmationModalService
      .showConfirmationModalWithReason(
        `Terminate transfer ${transferProcessId}`,
        'Terminating a transfer is irreversible. Are you sure you want to terminate transfer?'
      )
      .then((result) => {
        if (result) {
          const reasonWithRole =
            role === ContractRoleEnum.PROVIDER
              ? `Provider note: ${result || 'Terminated by provider'}`
              : `Consumer note: ${result || 'Terminated by consumer'}`;
          this.transferService.terminateTransfer.mutate(
            { transferProcessId, reason: reasonWithRole },
            { onSuccess: () => this.transferService.enableRefresh(transferProcessId) }
          );
        }
      });
  }

  refresh(transferProcessId: string | undefined) {
    if (!transferProcessId) return;
    this.transferService.enableRefresh(transferProcessId);
    this.transferService.getTransferStateQuery(transferProcessId);
  }

  getAvailableActions(id: string, state: TransferStateEnum, role: string) {
    return ACTIONS.map((action) => {
      let handler: (id: string, role: string) => void;
      let isEnabled: boolean;
      switch (action.action) {
        case 'SUSPEND':
          handler = (id, role) => this.suspend(id, role);
          isEnabled = state === TransferStateEnum.STARTED;
          break;
        case 'RESUME':
          handler = (id) => this.resume(id);
          isEnabled = state === TransferStateEnum.SUSPENDED;
          break;
        case 'DEPROVISION':
          handler = (id) => this.deprovision(id);
          isEnabled = state === TransferStateEnum.COMPLETED && role === ContractRoleEnum.PROVIDER;
          break;
        case 'REFRESH_STATE':
          handler = (id) => this.refresh(id);
          isEnabled = state !== TransferStateEnum.TERMINATED;
          break;
        case 'TERMINATE':
          handler = (id, role) => this.terminate(id, role);
          isEnabled =
            state !== TransferStateEnum.TERMINATED && state !== TransferStateEnum.TERMINATING;
          break;
        default:
          handler = () => {
            /* empty */
          };
          isEnabled = false;
      }
      return {
        ...action,
        handler: () => handler(id, role),
        isEnabled
      };
    }).filter((action) => action.isEnabled);
  }
}
