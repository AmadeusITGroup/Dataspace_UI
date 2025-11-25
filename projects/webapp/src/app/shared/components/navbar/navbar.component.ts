import { ChangeDetectionStrategy, Component, inject, linkedSignal } from '@angular/core';
import { QueryClient, injectIsFetching } from '@tanstack/angular-query-experimental';
import { LoginService } from '../../../core/services/login.service';

@Component({
  selector: 'app-navbar',
  templateUrl: 'navbar.component.html',
  styleUrl: 'navbar.component.scss',
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
}
