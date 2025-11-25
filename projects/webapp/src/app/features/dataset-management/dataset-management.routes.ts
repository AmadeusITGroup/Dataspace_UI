import { Routes } from '@angular/router';

export const DATASET_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'dataset',
        loadComponent: () => import('./pages/dataset/dataset.page')
      },
      {
        path: 'policy',
        loadComponent: () => import('./pages/policy/policy.page')
      },
      {
        path: 'contract-definition',
        loadComponent: () => import('./pages/contract-definition/contract-definition.page')
      }
    ]
  }
];
