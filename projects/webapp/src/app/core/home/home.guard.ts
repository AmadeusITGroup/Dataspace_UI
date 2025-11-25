import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { LoginService } from '../services/login.service';

@Injectable()
export class HomeGuard implements CanActivate {
  private readonly authService = inject(LoginService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    if (this.authService.loggedIn()) {
      this.router.navigate(['/catalog']);
      return false;
    }
    return true;
  }
}
