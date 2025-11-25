import { Routes } from '@angular/router';

export const CONTRACT_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'contract-negotiation',
        loadComponent: () => import('./pages/contract-negotiation/contract-negotiation.page')
      },
      {
        path: 'contract-transfer',
        loadComponent: () => import('./pages/contract-transfer/contract-transfer.page')
      }
    ]
  }
];
