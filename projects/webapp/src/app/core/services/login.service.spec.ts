import { TestBed } from '@angular/core/testing';

import { MsalService } from '@azure/msal-angular';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { of } from 'rxjs';
import { authProviders } from '../../app.config';
import { LoginService } from './login.service';

describe('LoginService', () => {
  let service: LoginService;
  let clear: jest.Mock;
  let msalService: MsalService;

  beforeEach(() => {
    clear = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        ...authProviders,
        {
          provide: QueryClient,
          useValue: {
            clear
          }
        }
      ]
    });
    service = TestBed.inject(LoginService);
    msalService = TestBed.inject(MsalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('logging out should clear the query cache', () => {
    jest.spyOn(msalService, 'logoutRedirect').mockReturnValue(of());
    service.logOut();
    expect(clear).toHaveBeenCalled();
    expect(msalService.logoutRedirect).toHaveBeenCalled();
  });
});
