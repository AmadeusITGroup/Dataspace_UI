import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetViewComponent } from './asset-view.component';
import { I18N } from '../../../../../../core/i18n/translation.en';
import { ComponentRef } from '@angular/core';

describe('AssetViewComponent', () => {
  let component: AssetViewComponent;
  let fixture: ComponentFixture<AssetViewComponent>;
  let ref: ComponentRef<AssetViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetViewComponent],
      providers: [
        { provide: 'I18N', useValue: I18N } // Provide the constant
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetViewComponent);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('asset', {
      '@id': 'asset-123',
      name: 'Sample Asset',
      type: 'image',
      description: 'A sample asset for testing purposes',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: 'user-456',
      tags: ['test', 'sample'],
      url: 'https://example.com/assets/asset-123.png',
      metadata: {
        resolution: '1920x1080',
        size: '2MB'
      }
    });
    ref.setInput('secret', null);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
