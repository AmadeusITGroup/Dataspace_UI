import type { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { msalConfig } from './config/auth.config';
import { HomeGuard } from './core/home/home.guard';

const canActivate = msalConfig ? [MsalGuard] : [];

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/home/home.page'),
    canActivate: [HomeGuard]
  },
  {
    path: 'catalog',
    loadComponent: () => import('./features/federated-catalog/pages/catalog/catalog.page'),
    canActivate
  },
  {
    path: 'dataset-management',
    canActivate,
    loadChildren: () =>
      import('./features/dataset-management/dataset-management.routes').then(
        (m) => m.DATASET_MANAGEMENT_ROUTES
      )
  },
  {
    path: 'contract-management',
    canActivate,
    loadChildren: () =>
      import('./features/contract-management/contract-management.routes').then(
        (m) => m.CONTRACT_MANAGEMENT_ROUTES
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
