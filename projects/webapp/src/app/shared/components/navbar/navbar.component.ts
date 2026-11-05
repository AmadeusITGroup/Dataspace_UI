import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core';
import { QueryClient, injectIsFetching } from '@tanstack/angular-query-experimental';
import { LoginService } from '../../../core/services/login.service';
import { organizationConfig } from '../../../config/organization/organization.config';
import { NgOptimizedImage } from '@angular/common';
import {
  DfTopNav,
  DfTopNavBrand,
  DfTopNavBrandLinkContent,
  DfTopNavQuickAction,
  DfTopNavQuickActionInTopNav,
  DfTopNavQuickActions
} from '@design-factory/angular/topnav';

@Component({
  selector: 'app-navbar',
  templateUrl: 'navbar.component.html',
  styleUrl: 'navbar.component.scss',
  imports: [
    NgOptimizedImage,
    DfTopNav,
    DfTopNavBrand,
    DfTopNavBrandLinkContent,
    DfTopNavQuickActions,
    DfTopNavQuickAction,
    DfTopNavQuickActionInTopNav
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
  readonly loginService = inject(LoginService);
  readonly queryClient = inject(QueryClient);
  readonly isFetching = injectIsFetching();
  readonly isRefreshing = linkedSignal({
    source: this.isFetching,
    computation: (source, previous) => !!(source || previous?.value)
  });
  protected readonly organizationConfig = organizationConfig;
}
