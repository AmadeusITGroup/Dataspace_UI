import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CRUD } from '../../../../../../../core/models/crud';
import { AssetDataAddressKafkaComponent } from './asset-data-address-kafka.component';

describe('AssetDataAddressKafkaComponent', () => {
  let component: AssetDataAddressKafkaComponent;
  let fixture: ComponentFixture<AssetDataAddressKafkaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetDataAddressKafkaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AssetDataAddressKafkaComponent);
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
      expect(component.dataAddressForm.get('bootstrapServers')).toBeDefined();
      expect(component.dataAddressForm.get('topic')).toBeDefined();
      expect(component.dataAddressForm.get('securityProtocol')).toBeDefined();
    });

    it('should initialize with default values', () => {
      expect(component.dataAddressForm.get('bootstrapServers')?.value).toBe('');
      expect(component.dataAddressForm.get('topic')?.value).toBe('');
      expect(component.dataAddressForm.get('securityProtocol')?.value).toBe('PLAINTEXT');
    });

    it('should initialize auth sub-forms', () => {
      // Initially PLAINTEXT, so saslAuthGroup should be undefined
      expect(component.saslAuthGroup).toBeUndefined();
      expect(component.sslAuthGroup).toBeDefined();

      // Switch to SASL_SSL to initialize saslAuthGroup
      component.dataAddressForm.get('securityProtocol')?.setValue('SASL_SSL');
      expect(component.saslAuthGroup).toBeDefined();
    });
  });

  describe('Bootstrap Servers Validation', () => {
    it('should be invalid when bootstrapServers is empty', () => {
      const control = component.dataAddressForm.get('bootstrapServers');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should be valid with single server', () => {
      const control = component.dataAddressForm.get('bootstrapServers');
      control?.setValue('localhost:9092');
      expect(control?.valid).toBe(true);
    });

    it('should be valid with multiple servers', () => {
      const control = component.dataAddressForm.get('bootstrapServers');
      control?.setValue('server1:9092,server2:9092,server3:9092');
      expect(control?.valid).toBe(true);
    });
  });

  describe('Topic Validation', () => {
    it('should be invalid when topic is empty', () => {
      const control = component.dataAddressForm.get('topic');
      control?.setValue('');
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should be valid with a topic name', () => {
      const control = component.dataAddressForm.get('topic');
      control?.setValue('my-topic');
      expect(control?.valid).toBe(true);
    });
  });

  describe('Form Validation States', () => {
    it('should be invalid when bootstrapServers and topic are empty', () => {
      expect(component.dataAddressForm.valid).toBe(false);
    });

    it('should be valid with bootstrapServers and topic filled', () => {
      component.dataAddressForm.patchValue({
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic'
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
        bootstrapServers: '',
        topic: ''
      });
      expect(component.isFormValid()).toBe(false);
    });

    it('should return true from isFormValid when form is valid', () => {
      component.dataAddressForm.patchValue({
        bootstrapServers: 'localhost:9092',
        topic: 'test-topic'
      });
      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace in bootstrap servers', () => {
      const control = component.dataAddressForm.get('bootstrapServers');
      control?.setValue('  broker1:9092 , broker2:9092  ');
      expect(control?.valid).toBe(true);
    });
  });
});
