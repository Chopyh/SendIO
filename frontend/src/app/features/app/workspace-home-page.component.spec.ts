import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WorkspaceHomePageComponent } from './workspace-home-page.component';
import { I18nStore } from '../../core/i18n/i18n.store';

describe('WorkspaceHomePageComponent', () => {
  let fixture: ComponentFixture<WorkspaceHomePageComponent>;
  let component: WorkspaceHomePageComponent;
  let mockI18nStore: any;

  beforeEach(async () => {
    mockI18nStore = {
      locale: () => 'en',
      t: (key: string) => key
    };

    await TestBed.configureTestingModule({
      imports: [WorkspaceHomePageComponent],
      providers: [
        provideRouter([]),
        { provide: I18nStore, useValue: mockI18nStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceHomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render successfully', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to 30d range and updates dataset correctly', () => {
    expect(component.activeRange()).toBe('30d');
    expect(component.activeDataset().metrics.sent.value).toBe('32,450');

    component.activeRange.set('7d');
    fixture.detectChanges();
    expect(component.activeDataset().metrics.sent.value).toBe('8,430');
  });

  it('updates hovered index on mouse interactions', () => {
    expect(component.hoveredIndex()).toBeNull();
    component.hoveredIndex.set(2);
    expect(component.hoveredIndex()).toBe(2);
  });
});
