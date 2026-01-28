import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { NgOptimizedImage } from '@angular/common';
import { organizationConfig } from '../../config/organization/organization.config';

@Component({
  styleUrl: './home.page.scss',
  template: `
    <div class="px-0 position-relative img-container">
      @let bgImage = organizationConfig.ORG_BG_IMAGE || undefined;
      @if (!!bgImage) {
        <picture>
          <source
            type="image/webp"
            media="(max-width: 1199px)"
            [srcset]="'assets/' + bgImage + '.webp'"
          />
          <source
            type="image/avif"
            media="(max-width: 1199px)"
            [srcset]="'assets/' + bgImage + '.avif'"
          />
          <img alt="header image" class="header-img" [src]="'assets/' + bgImage + '.jpg'" />
        </picture>
      }
      <div
        class="text-info position-absolute w-100  title-div d-flex flex-column align-items-center gap-4"
      >
        <div class="d-flex flex-column gap-4 align-items-center mt-5">
          <a [href]="organizationConfig.ORG_ADDRESS">
            <img [ngSrc]="organizationConfig.ORG_LOGO" alt="fancy logo" width="196" height="196" />
          </a>
          <h1 class="text-center">Data sharing that keeps us moving</h1>
        </div>
        <button class="btn btn-primary px-5" (click)="loginService.logIn()">Log in</button>
      </div>
    </div>
  `,
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class HomePageComponent {
  readonly router = inject(Router);
  readonly loginService = inject(LoginService);

  constructor() {
    effect(() => {
      if (this.loginService.loggedIn()) {
        this.router.navigate(['./catalog']);
      }
    });
  }

  protected readonly organizationConfig = organizationConfig;
}
