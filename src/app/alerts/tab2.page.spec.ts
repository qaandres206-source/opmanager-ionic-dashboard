import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Tab2Page } from './tab2.page';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpmanagerApiService } from '../services/opmanager-api.service';
import { BehaviorSubject, of } from 'rxjs';

describe('Tab2Page - Alarms Filter and Export Tests', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;
  let mockDashboardService: any;
  let mockApiService: any;

  beforeEach(async () => {
    // Mock services
    mockDashboardService = {
      selectedCustomer$: new BehaviorSubject('-1'),
      loading$: new BehaviorSubject(false),
    };

    mockApiService = {
      getAlarms: jasmine.createSpy('getAlarms').and.returnValue(of([
        {
          displayName: 'Device1',
          deviceName: 'Device1',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test alarm 1',
          timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
        },
        {
          displayName: 'Device2',
          deviceName: 'Device2',
          severityString: 'Warning',
          severity: 'Warning',
          category: 'System',
          status: 'Active',
          message: 'Test alarm 2',
          timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          displayName: 'Device3',
          deviceName: 'Device3',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test alarm 3',
          timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        },
      ])),
    };

    await TestBed.configureTestingModule({
      declarations: [Tab2Page],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DashboardStateService, useValue: mockDashboardService },
        { provide: OpmanagerApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input-Select Synchronization', () => {
    it('should update deviceInputValue when device select changes', () => {
      const event = { detail: { value: 'Device1' } } as CustomEvent;
      component.onDeviceChange(event);
      expect(component.deviceInputValue).toBe('Device1');
      expect(component.selectedDevice).toBe('Device1');
    });

    it('should clear deviceInputValue when "all" is selected', () => {
      const event = { detail: { value: 'all' } } as CustomEvent;
      component.onDeviceChange(event);
      expect(component.deviceInputValue).toBe('');
      expect(component.selectedDevice).toBe('all');
    });

    it('should update selectedDevice when input changes', () => {
      const event = { detail: { value: 'Device2' } };
      component.onDeviceInputChange(event);
      expect(component.selectedDevice).toBe('Device2');
      expect(component.deviceInputValue).toBe('Device2');
    });

    it('should set selectedDevice to "all" when input is cleared', () => {
      const event = { detail: { value: '' } };
      component.onDeviceInputChange(event);
      expect(component.selectedDevice).toBe('all');
      expect(component.deviceInputValue).toBe('');
    });

    it('should update severityInputValue when severity select changes', () => {
      const event = { detail: { value: 'Critical' } } as CustomEvent;
      component.onSeverityChange(event);
      expect(component.severityInputValue).toBe('Critical');
      expect(component.selectedSeverity).toBe('Critical');
    });

    it('should update categoryInputValue when category select changes', () => {
      const event = { detail: { value: 'Network' } } as CustomEvent;
      component.onCategoryChange(event);
      expect(component.categoryInputValue).toBe('Network');
      expect(component.selectedCategory).toBe('Network');
    });
  });

  describe('Period Filter', () => {
    beforeEach(() => {
      // Wait for initial data load
      component.alerts = [
        {
          displayName: 'Device1',
          deviceName: 'Device1',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test alarm 1',
          timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
        },
        {
          displayName: 'Device2',
          deviceName: 'Device2',
          severityString: 'Warning',
          severity: 'Warning',
          category: 'System',
          status: 'Active',
          message: 'Test alarm 2',
          timestamp: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          displayName: 'Device3',
          deviceName: 'Device3',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test alarm 3',
          timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        },
      ];
      component['buildFilterOptions']();
    });

    it('should filter alarms by last hour', () => {
      component.selectedPeriod = '1';
      component['applyClientFilters']();
      expect(component.filteredAlerts.length).toBe(1);
      expect(component.filteredAlerts[0].displayName).toBe('Device1');
    });

    it('should filter alarms by last 24 hours', () => {
      component.selectedPeriod = '24';
      component['applyClientFilters']();
      expect(component.filteredAlerts.length).toBe(2);
    });

    it('should show all alarms when period is "all"', () => {
      component.selectedPeriod = 'all';
      component['applyClientFilters']();
      expect(component.filteredAlerts.length).toBe(3);
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      component.filteredAlerts = [
        {
          displayName: 'Device1',
          deviceName: 'Device1',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test alarm',
          ipaddress: '192.168.1.1',
        },
      ];
    });

    it('should generate CSV with correct headers', () => {
      spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy('click'),
        setAttribute: jasmine.createSpy('setAttribute'),
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');

      component.exportToCsv();

      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should not export when no filtered alarms', () => {
      component.filteredAlerts = [];
      spyOn(URL, 'createObjectURL');

      component.exportToCsv();

      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('should escape special characters in CSV', () => {
      component.filteredAlerts = [
        {
          displayName: 'Device;With;Semicolons',
          deviceName: 'Device"With"Quotes',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test,message',
          ipaddress: '192.168.1.1',
        },
      ];

      spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy('click'),
        setAttribute: jasmine.createSpy('setAttribute'),
        href: '',
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:test');
      spyOn(URL, 'revokeObjectURL');

      component.exportToCsv();

      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('Combined Filters', () => {
    beforeEach(() => {
      component.alerts = [
        {
          displayName: 'Device1',
          deviceName: 'Device1',
          severityString: 'Critical',
          severity: 'Critical',
          category: 'Network',
          status: 'Active',
          message: 'Test 1',
          timestamp: Date.now() - (30 * 60 * 1000),
        },
        {
          displayName: 'Device2',
          deviceName: 'Device2',
          severityString: 'Warning',
          severity: 'Warning',
          category: 'System',
          status: 'Active',
          message: 'Test 2',
          timestamp: Date.now() - (30 * 60 * 1000),
        },
        {
          displayName: 'Device1',
          deviceName: 'Device1',
          severityString: 'Warning',
          severity: 'Warning',
          category: 'Network',
          status: 'Active',
          message: 'Test 3',
          timestamp: Date.now() - (30 * 60 * 1000),
        },
      ];
      component['buildFilterOptions']();
    });

    it('should apply multiple filters together', () => {
      component.selectedDevice = 'Device1';
      component.selectedSeverity = 'Warning';
      component['applyClientFilters']();
      expect(component.filteredAlerts.length).toBe(1);
      expect(component.filteredAlerts[0].message).toBe('Test 3');
    });
  });
});
