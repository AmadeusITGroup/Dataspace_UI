import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { RouterService } from './router.service';

describe('RouterService', () => {
  let service: RouterService;
  let routerEventsSubject: Subject<any>;
  let mockRouter: Partial<Router>;

  beforeEach(() => {
    routerEventsSubject = new Subject();
    mockRouter = {
      events: routerEventsSubject.asObservable(),
      url: '/initial'
    };

    TestBed.configureTestingModule({
      providers: [RouterService, { provide: Router, useValue: mockRouter }]
    });

    service = TestBed.inject(RouterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with current router URL', () => {
    expect(service.routerUrl()).toBe('/initial');
  });

  it('should update routerUrl signal on NavigationEnd event', () => {
    const navigationEnd = new NavigationEnd(1, '/new-url', '/new-url');
    routerEventsSubject.next(navigationEnd);

    expect(service.routerUrl()).toBe('/new-url');
  });

  it('should not update routerUrl signal for non-NavigationEnd events', () => {
    const initialUrl = service.routerUrl();
    routerEventsSubject.next({ type: 'other-event' });

    expect(service.routerUrl()).toBe(initialUrl);
  });

  it('should handle multiple navigation events', () => {
    routerEventsSubject.next(new NavigationEnd(1, '/page1', '/page1'));
    expect(service.routerUrl()).toBe('/page1');

    routerEventsSubject.next(new NavigationEnd(2, '/page2', '/page2'));
    expect(service.routerUrl()).toBe('/page2');

    routerEventsSubject.next(new NavigationEnd(3, '/page3', '/page3'));
    expect(service.routerUrl()).toBe('/page3');
  });
});
