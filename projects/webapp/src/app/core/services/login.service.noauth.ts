import { Injectable, signal } from '@angular/core';
import { AbstractLoginService } from './login.service.common';

declare const PARTICIPANT_ID: string;

@Injectable({
  providedIn: 'root'
})
export class LoginService extends AbstractLoginService {
  #loggedIn = signal(false);
  public readonly loggedIn = this.#loggedIn.asReadonly();
  public readonly idTokenClaims = () => ({
    roles: [`Participant.${PARTICIPANT_ID}`]
  });

  logOut() {
    this.#loggedIn.set(false);
    window.location.href = '/';
  }

  logIn() {
    this.#loggedIn.set(true);
  }
}
