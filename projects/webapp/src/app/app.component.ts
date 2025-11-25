import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginService } from './core/services/login.service';
import { RouterService } from './core/services/router.service';
import { ToastsContainerComponent } from './core/toasts/toasts-container.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

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
export class AppComponent {
  readonly loginService = inject(LoginService);
  readonly destroyRef = inject(DestroyRef);
  readonly routerUrl = inject(RouterService).routerUrl;

  public readonly isNavigationEnabled = computed(() => this.routerUrl() !== '/');
}
