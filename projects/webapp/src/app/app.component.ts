import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  AfterViewInit,
  computed,
  DestroyRef,
  inject
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginService } from './core/services/login.service';
import { RouterService } from './core/services/router.service';
import { ToastsContainerComponent } from './core/toasts/toasts-container.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { organizationConfig } from './config/organization/organization.config';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    SidebarComponent,
    NavbarComponent,
    CommonModule,
    ToastsContainerComponent
  ],
  templateUrl: 'app.component.html',
  styleUrl: 'app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit {
  readonly loginService = inject(LoginService);
  readonly destroyRef = inject(DestroyRef);
  readonly routerUrl = inject(RouterService).routerUrl;

  public readonly isNavigationEnabled = computed(() => this.routerUrl() !== '/');

  ngAfterViewInit(): void {
    // Only run in browser
    if (typeof document !== 'undefined') {
      document.title = `Dataset Portal - ${organizationConfig.ORG_NAME}`;
      const favicon = document.querySelector("link[rel='icon']");
      if (favicon) {
        favicon.setAttribute('href', organizationConfig.ORG_LOGO);
      }
    }
  }
}
