import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { HomeGuard } from './home.guard';
import { LoginService } from '../services/login.service';

describe('HomeGuard', () => {
  let guard: HomeGuard;
  let mockLoginService: Partial<LoginService>;
  let mockRouter: Partial<Router>;
  let loggedInSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    loggedInSignal = signal(false);
    mockLoginService = {
      loggedIn: loggedInSignal
    };
    mockRouter = {
      navigate: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        HomeGuard,
        { provide: LoginService, useValue: mockLoginService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    guard = TestBed.inject(HomeGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation when user is not logged in', () => {
    loggedInSignal.set(false);
    const result = guard.canActivate();
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to catalog and prevent activation when user is logged in', () => {
    loggedInSignal.set(true);
    const result = guard.canActivate();
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/catalog']);
  });
});
