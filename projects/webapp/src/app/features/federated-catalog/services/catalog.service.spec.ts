import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { filter, firstValueFrom, of } from 'rxjs';
import { CatalogService } from './catalog.service';

// Mock the ManagementApiService
const mockManagementApiService = {
  participantcatalog: jest.fn()
};

jest.mock('management-sdk-be', () => ({
  ManagementApiService: jest.fn().mockImplementation(() => mockManagementApiService)
}));

import { ManagementApiService } from 'management-sdk-be';

describe('CatalogService', () => {
  let participantcatalog: jest.Mock;

  beforeEach(() => {
    participantcatalog = jest.fn();
    mockManagementApiService.participantcatalog = participantcatalog;
  });

  const getCatalogService = () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ManagementApiService,
          useValue: mockManagementApiService
        },
        provideTanStackQuery(
          new QueryClient({
            defaultOptions: {
              queries: {
                retry: false
              }
            }
          })
        ),
        CatalogService
      ]
    });
    return TestBed.inject(CatalogService);
  };

  it('should be created', () => {
    expect(getCatalogService()).toBeTruthy();
  });

  it('should filter empty datasets', async () => {
    participantcatalog.mockReturnValue(
      of([
        {
          '@context': {
            '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
            dcat: 'http://www.w3.org/ns/dcat#'
          },
          'dcat:dataset': [],
          id: 'item1',
          '@id': 'item1'
        }
      ])
    );

    const service = getCatalogService();
    await firstValueFrom(
      toObservable(service.catalogQuery.status, {
        injector: TestBed.inject(Injector)
      }).pipe(filter((status) => status !== 'pending'))
    );
    expect(service.catalogQuery.status()).toBe('success');
    expect(participantcatalog).toHaveBeenCalled();
    expect(service.catalogQuery.isSuccess()).toBe(true);
    expect(service.catalogQuery.data()).toStrictEqual([]);
  });

  it('should support both arrays and singular datasets', async () => {
    participantcatalog.mockReturnValue(
      of([
        {
          '@context': {
            '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
            dcat: 'http://www.w3.org/ns/dcat#'
          },
          'dcat:dataset': [
            {
              name: 'name1',
              description: 'description1',
              id: 'dataset1'
            },
            {
              name: 'name2',
              description: 'description2',
              id: 'dataset2'
            }
          ],
          id: 'item1',
          '@id': 'item1'
        },
        {
          '@context': {
            '@vocab': 'https://w3id.org/edc/v0.0.1/ns/',
            dcat: 'http://www.w3.org/ns/dcat#'
          },
          'dcat:dataset': {
            name: 'name',
            description: 'description',
            id: 'dataset3'
          },
          id: 'item2',
          '@id': 'item2'
        }
      ])
    );
    const service = getCatalogService();
    await firstValueFrom(
      toObservable(service.catalogQuery.status, {
        injector: TestBed.inject(Injector)
      }).pipe(filter((status) => status !== 'pending'))
    );
    expect(service.catalogQuery.status()).toBe('success');
    expect(service.catalogQuery.data()).toStrictEqual([
      {
        dataset: [
          {
            description: 'description1',
            id: 'dataset1',
            name: 'name1',
            hasPolicy: []
          },
          {
            description: 'description2',
            id: 'dataset2',
            name: 'name2',
            hasPolicy: []
          }
        ],
        '@id': 'item1',
        id: 'item1'
      },
      {
        dataset: [
          {
            description: 'description',
            id: 'dataset3',
            name: 'name',
            hasPolicy: []
          }
        ],
        '@id': 'item2',
        id: 'item2'
      }
    ]);
  });
});
