import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CRUD } from '../../../../../../../core/models/crud';
import { StorageAccountService } from '../../../../../../settings/services/storage-account.service';
import { AzureStorageBrowserService } from '../../../../../../settings/services/azure-storage-browser.service';
import { AssetDataAddressAzureBlobComponent } from './asset-data-address-azure-blob.component';

describe('AssetDataAddressAzureBlobComponent', () => {
  let component: AssetDataAddressAzureBlobComponent;
  let fixture: ComponentFixture<AssetDataAddressAzureBlobComponent>;

  const mockStorageAccountService = {
    accounts: signal([]),
    getAccountKey: jest.fn().mockResolvedValue(null),
    createAccountMutation: { mutate: jest.fn() },
    updateAccountMutation: { mutate: jest.fn() },
    deleteAccountMutation: { mutate: jest.fn() },
    isRegistered: jest.fn().mockReturnValue(false)
  };

  const mockAzureBrowserService = {
    listContainers: jest.fn().mockResolvedValue([]),
    listBlobs: jest.fn().mockResolvedValue([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetDataAddressAzureBlobComponent]
    })
      .overrideComponent(AssetDataAddressAzureBlobComponent, {
        set: {
          providers: [
            { provide: StorageAccountService, useValue: mockStorageAccountService },
            { provide: AzureStorageBrowserService, useValue: mockAzureBrowserService }
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(AssetDataAddressAzureBlobComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dataAddress', null);
    fixture.componentRef.setInput('secret', null);
    fixture.componentRef.setInput('mode', CRUD.CREATE);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize dataAddressForm with required controls', () => {
      expect(component.dataAddressForm).toBeDefined();
      expect(component.dataAddressForm.get('account')).toBeDefined();
      expect(component.dataAddressForm.get('container')).toBeDefined();
      expect(component.dataAddressForm.get('blobName')).toBeDefined();
      expect(component.dataAddressForm.get('keyName')).toBeDefined();
      expect(component.dataAddressForm.get('storageKey')).toBeDefined();
    });

    it('should initialize with empty default values', () => {
      expect(component.dataAddressForm.get('account')?.value).toBe('');
      expect(component.dataAddressForm.get('container')?.value).toBe('');
      expect(component.dataAddressForm.get('blobName')?.value).toBe('');
      expect(component.dataAddressForm.get('keyName')?.value).toBe('');
      expect(component.dataAddressForm.get('storageKey')?.value).toBe('');
    });
  });

  describe('Account Validation', () => {
    it('should be invalid when account is empty', () => {
      const control = component.dataAddressForm.get('account');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should be valid with a storage account name', () => {
      const control = component.dataAddressForm.get('account');
      control?.setValue('mystorageaccount');
      expect(control?.valid).toBe(true);
    });
  });

  describe('Container Validation', () => {
    it('should be invalid when container is empty', () => {
      const control = component.dataAddressForm.get('container');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should be valid with a container name', () => {
      const control = component.dataAddressForm.get('container');
      control?.setValue('my-container');
      expect(control?.valid).toBe(true);
    });
  });

  describe('BlobName Validation', () => {
    it('should be valid when blobName is empty (optional field)', () => {
      const control = component.dataAddressForm.get('blobName');
      control?.setValue('');
      expect(control?.valid).toBe(true);
    });

    it('should be valid with a blob name', () => {
      const control = component.dataAddressForm.get('blobName');
      control?.setValue('data.json');
      expect(control?.valid).toBe(true);
    });
  });

  describe('KeyName Validation', () => {
    it('should be invalid when keyName is empty', () => {
      const control = component.dataAddressForm.get('keyName');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should be valid with a key name', () => {
      const control = component.dataAddressForm.get('keyName');
      control?.setValue('my-storage-key');
      expect(control?.valid).toBe(true);
    });
  });

  describe('StorageKey Validation', () => {
    it('should be invalid when storageKey is empty', () => {
      const control = component.dataAddressForm.get('storageKey');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should be valid with a storage key', () => {
      const control = component.dataAddressForm.get('storageKey');
      control?.setValue('my-secret-key');
      expect(control?.valid).toBe(true);
    });
  });

  describe('Form Validation States', () => {
    it('should be invalid when all required fields are empty', () => {
      expect(component.dataAddressForm.valid).toBe(false);
    });

    it('should be valid with all required fields filled', () => {
      component.dataAddressForm.patchValue({
        account: 'mystorageaccount',
        container: 'my-container',
        keyName: 'my-key',
        storageKey: 'my-secret'
      });
      expect(component.dataAddressForm.valid).toBe(true);
    });

    it('should be valid with all fields including optional blobName', () => {
      component.dataAddressForm.patchValue({
        account: 'mystorageaccount',
        container: 'my-container',
        blobName: 'data.json',
        keyName: 'my-key',
        storageKey: 'my-secret'
      });
      expect(component.dataAddressForm.valid).toBe(true);
    });
  });

  describe('Component API', () => {
    it('should expose isFormValid method', () => {
      expect(component.isFormValid).toBeDefined();
      expect(typeof component.isFormValid).toBe('function');
    });

    it('should return false from isFormValid when form is invalid', () => {
      component.dataAddressForm.patchValue({
        account: '',
        container: ''
      });
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true from isFormValid when form is valid', () => {
      component.dataAddressForm.patchValue({
        account: 'mystorageaccount',
        container: 'my-container',
        keyName: 'my-key',
        storageKey: 'my-secret'
      });
      expect(component.isFormValid()).toBe(true);
    });

    it('should expose enableForm method', () => {
      expect(component.enableForm).toBeDefined();
      expect(typeof component.enableForm).toBe('function');
    });

    it('should enable the form when enableForm is called', () => {
      component.dataAddressForm.disable();
      expect(component.dataAddressForm.disabled).toBe(true);
      component.enableForm();
      expect(component.dataAddressForm.enabled).toBe(true);
    });
  });

  describe('Secret Toggle', () => {
    it('should toggle showSecret', () => {
      expect(component.showSecret).toBe(false);
      component.toggleSecret();
      expect(component.showSecret).toBe(true);
      component.toggleSecret();
      expect(component.showSecret).toBe(false);
    });
  });

  describe('Delete Secret', () => {
    it('should clear keyName and storageKey on deleteSecret', () => {
      component.dataAddressForm.patchValue({
        account: 'mystorageaccount',
        container: 'my-container',
        keyName: 'my-key',
        storageKey: 'my-secret'
      });

      component.deleteSecret();

      expect(component.dataAddressForm.get('keyName')?.value).toBe('');
      expect(component.dataAddressForm.get('storageKey')?.value).toBe('');
    });

    it('should mark the form as dirty after deleteSecret', () => {
      component.deleteSecret();
      expect(component.dataAddressForm.dirty).toBe(true);
    });
  });

  describe('Browse Mode', () => {
    it('should initialize browseMode as false', () => {
      expect(component.browseMode()).toBe(false);
    });

    it('should toggle browseMode', () => {
      component.toggleBrowseMode();
      expect(component.browseMode()).toBe(true);
      component.toggleBrowseMode();
      expect(component.browseMode()).toBe(false);
    });

    it('should clear containers and blobs when entering browse mode', () => {
      component.containers.set([{ name: 'test' }]);
      component.blobs.set([{ name: 'blob.txt' }]);
      component.toggleBrowseMode();
      expect(component.containers()).toEqual([]);
      expect(component.blobs()).toEqual([]);
    });
  });
});
