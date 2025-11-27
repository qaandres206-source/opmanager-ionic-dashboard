import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Tab1Page } from './tab1.page';
import { DashboardStateService } from '../services/dashboard-state.service';
import { OpmanagerApiService } from '../services/opmanager-api.service';
import { BehaviorSubject, of } from 'rxjs';

describe('Tab1Page - Devices Filter and Export Tests', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;
  let mockDashboardService: any;
  let mockApiService: any;

  beforeEach(async () => {
    mockDashboardService = {
      selectedCustomer$: new BehaviorSubject('-1'),
      devices$: new BehaviorSubject([
        {
          displayName: 'Switch1',
          deviceName: 'Switch1',
          ipaddress: '192.168.1.1',
          statusStr: 'clear',
          category: 'Switch',
          type: 'Switch',
          prettyTime: '2024-01-01',
        },
        {
          displayName: 'Router1',
          deviceName: 'Router1',
          ipaddress: '192.168.1.2',
          statusStr: 'critical',
          category: 'Router',
          type: 'Router',
          prettyTime: '2024-01-02',
        },
        {
          displayName: 'Switch2',
          deviceName: 'Switch2',
          ipaddress: '192.168.1.3',
          statusStr: 'warning',
          category: 'Switch',
          type: 'Switch',
          prettyTime: '2024-01-03',
        },
      ]),
      customers$: of([]),
      refreshAll: jasmine.createSpy('refreshAll').and.returnValue(of({})),
    };

    mockApiService = {};

    await TestBed.configureTestingModule({
      declarations: [Tab1Page],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: DashboardStateService, useValue: mockDashboardService },
        { provide: OpmanagerApiService, useValue: mockApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input-Select Synchronization', () => {
    it('should update typeInputValue when type select changes', () => {
      const event = { detail: { value: 'Switch' } } as CustomEvent;
      component.onTypeChange(event);
      expect(component.typeInputValue).toBe('Switch');
      expect(component.selectedType).toBe('Switch');
    });

    it('should clear typeInputValue when "all" is selected', () => {
      const event = { detail: { value: 'all' } } as CustomEvent;
      component.onTypeChange(event);
      expect(component.typeInputValue).toBe('');
      expect(component.selectedType).toBe('all');
    });

    it('should update selectedType when input changes', () => {
      const event = { detail: { value: 'Router' } };
      component.onTypeInputChange(event);
      expect(component.selectedType).toBe('Router');
      expect(component.typeInputValue).toBe('Router');
    });

    it('should set selectedType to "all" when input is cleared', () => {
      const event = { detail: { value: '' } };
      component.onTypeInputChange(event);
      expect(component.selectedType).toBe('all');
      expect(component.typeInputValue).toBe('');
    });

    it('should update statusInputValue when status select changes', () => {
      const event = { detail: { value: 'critical' } } as CustomEvent;
      component.onStatusChange(event);
      expect(component.statusInputValue).toBe('critical');
      expect(component.selectedStatus).toBe('critical');
    });

    it('should update selectedStatus when input changes', () => {
      const event = { detail: { value: 'warning' } };
      component.onStatusInputChange(event);
      expect(component.selectedStatus).toBe('warning');
      expect(component.statusInputValue).toBe('warning');
    });
  });

  describe('Filtering', () => {
    it('should filter devices by type', () => {
      component.selectedType = 'Switch';
      component.applyFilters();
      expect(component.filteredDevices.length).toBe(2);
      expect(component.filteredDevices.every(d => d.category === 'Switch')).toBe(true);
    });

    it('should filter devices by status', () => {
      component.selectedStatus = 'critical';
      component.applyFilters();
      expect(component.filteredDevices.length).toBe(1);
      expect(component.filteredDevices[0].statusStr).toBe('critical');
    });

    it('should apply multiple filters together', () => {
      component.selectedType = 'Switch';
      component.selectedStatus = 'warning';
      component.applyFilters();
      expect(component.filteredDevices.length).toBe(1);
      expect(component.filteredDevices[0].displayName).toBe('Switch2');
    });

    it('should show all devices when filters are "all"', () => {
      component.selectedType = 'all';
      component.selectedStatus = 'all';
      component.applyFilters();
      expect(component.filteredDevices.length).toBe(3);
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      component.filteredDevices = [
        {
          displayName: 'Switch1',
          deviceName: 'Switch1',
          ipaddress: '192.168.1.1',
          statusStr: 'clear',
          category: 'Switch',
          type: 'Switch',
          prettyTime: '2024-01-01',
        },
      ];
    });

    it('should generate CSV with correct data', () => {
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

    it('should not export when no filtered devices', () => {
      component.filteredDevices = [];
      spyOn(URL, 'createObjectURL');

      component.exportToCsv();

      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('should export only filtered devices', () => {
      component.devices = [
        {
          displayName: 'Device1',
          deviceName: 'Device1',
          ipaddress: '192.168.1.1',
          statusStr: 'clear',
          category: 'Switch',
          type: 'Switch',
          prettyTime: '2024-01-01',
        },
        {
          displayName: 'Device2',
          deviceName: 'Device2',
          ipaddress: '192.168.1.2',
          statusStr: 'critical',
          category: 'Router',
          type: 'Router',
          prettyTime: '2024-01-02',
        },
      ];
      component.selectedType = 'Switch';
      component.applyFilters();

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

  describe('Pagination', () => {
    it('should paginate devices correctly', () => {
      component.filteredDevices = Array(150).fill(null).map((_, i) => ({
        displayName: `Device${i}`,
        deviceName: `Device${i}`,
        ipaddress: `192.168.1.${i}`,
        statusStr: 'clear',
        category: 'Switch',
        type: 'Switch',
        prettyTime: '2024-01-01',
      }));
      component.currentPage = 1;
      component.pageSize = 50;

      const paged = component.pagedDevices;
      expect(paged.length).toBe(50);
      expect(paged[0].displayName).toBe('Device0');
    });

    it('should calculate total pages correctly', () => {
      component.filteredDevices = Array(125).fill(null).map(() => ({} as any));
      component.pageSize = 50;
      expect(component.totalDevicePages).toBe(3);
    });
  });
});
