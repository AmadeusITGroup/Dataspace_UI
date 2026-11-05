import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'storage-accounts',
        loadComponent: () => import('./pages/storage-accounts/storage-accounts.page')
      },
      {
        path: '',
        redirectTo: 'storage-accounts',
        pathMatch: 'full'
      }
    ]
  }
];
