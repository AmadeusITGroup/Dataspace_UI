import { computed, inject, Injectable, signal } from '@angular/core';
import {
  MSAL_GUARD_CONFIG,
  MsalBroadcastService,
  MsalGuardConfiguration,
  MsalService
} from '@azure/msal-angular';
import { AccountInfo, EventMessage, EventType, RedirectRequest } from '@azure/msal-browser';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { filter } from 'rxjs/operators';
import { AbstractLoginService } from './login.service.common';

/**
 * The Login Service, using APIM
 */
@Injectable({
  providedIn: 'root'
})
export class LoginService extends AbstractLoginService {
  private msalService = inject(MsalService);
  private msalBroadcastService = inject(MsalBroadcastService);
  private msalGuardConfig: MsalGuardConfiguration =
    inject<MsalGuardConfiguration>(MSAL_GUARD_CONFIG);
  private readonly queryClient = inject(QueryClient);
  private readonly account = signal<AccountInfo | null>(null);
  public readonly loggedIn = computed(() => !!this.account());
  public readonly idTokenClaims = computed(() => this.account()?.idTokenClaims ?? null);

  constructor() {
    super();
    this.msalService.handleRedirectObservable().subscribe();
    this.msalService.instance.enableAccountStorageEvents();
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.ACCOUNT_ADDED ||
            msg.eventType === EventType.ACCOUNT_REMOVED ||
            msg.eventType === EventType.LOGIN_SUCCESS
        )
      )
      .subscribe(() => {
        if (this.msalService.instance.getAllAccounts().length === 0) {
          window.location.pathname = '/';
        } else {
          this.setAccount();
        }
      });
    this.setAccount();
  }

  logOut() {
    this.queryClient.clear();
    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin
    });
  }

  logIn() {
    if (this.msalGuardConfig.authRequest) {
      this.msalService.loginRedirect({ ...this.msalGuardConfig.authRequest } as RedirectRequest);
    } else {
      this.msalService.loginRedirect();
    }
  }

  private setAccount() {
    let activeAccount = this.msalService.instance.getActiveAccount();

    if (!activeAccount && this.msalService.instance.getAllAccounts().length > 0) {
      const accounts = this.msalService.instance.getAllAccounts();
      activeAccount = accounts[0];
      this.msalService.instance.setActiveAccount(activeAccount);
    }
    this.account.set(activeAccount);
  }
}
