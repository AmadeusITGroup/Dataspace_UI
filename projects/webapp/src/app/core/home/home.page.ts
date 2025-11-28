import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Component({
  styleUrl: './home.page.scss',
  template: `
    <div class="px-0 position-relative img-container bg-primary-subtle">
      <div
        class="text-info position-absolute w-100  title-div d-flex flex-column align-items-center gap-4">
        <div class="d-flex flex-column gap-4 align-items-center mt-5">
          <a href="https://amadeus.com">
            <img src="1a-full.svg" alt="fancy logo" width="196" height="196" />
          </a>
          <h1 class="text-center">Data sharing that keeps us moving</h1>
        </div>
        <button class="btn btn-primary px-5" (click)="loginService.logIn()">Log in</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class HomePageComponent {
  readonly router = inject(Router);
  readonly loginService = inject(LoginService);
  readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      if (this.loginService.loggedIn()) {
        this.router.navigate(['./catalog']);
      }
    });
  }
}
