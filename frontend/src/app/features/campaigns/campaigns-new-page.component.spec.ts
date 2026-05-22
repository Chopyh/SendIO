import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CampaignApiService } from '../../core/campaigns/campaign-api.service';
import { CampaignsNewPageComponent } from './campaigns-new-page.component';

describe('CampaignsNewPageComponent', () => {
  let fixture: ComponentFixture<CampaignsNewPageComponent>;
  let component: CampaignsNewPageComponent;

  const campaignsApi = {
    listPublishedTemplates: vi.fn(),
    listContacts: vi.fn(),
    createCampaign: vi.fn(),
    dispatchCampaign: vi.fn(),
    rememberCampaign: vi.fn(),
  };

  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    campaignsApi.listPublishedTemplates.mockReturnValue(
      of([{ id: 'tpl-1', name: 'Welcome', versions: [2, 1] }]),
    );
    campaignsApi.listContacts.mockReturnValue(
      of([
        { id: 'contact-1', email: 'one@example.com' },
        { id: 'contact-2', email: 'two@example.com' },
      ]),
    );
    campaignsApi.createCampaign.mockReturnValue(
      of({
        data: {
          id: 'cmp-1',
          name: 'Launch',
          status: 'draft',
          template_id: 'tpl-1',
          template_version_id: 'tv-1',
          recipient_count: 2,
        },
      }),
    );
    campaignsApi.dispatchCampaign.mockReturnValue(of({ data: {} }));

    await TestBed.configureTestingModule({
      imports: [CampaignsNewPageComponent],
      providers: [
        { provide: CampaignApiService, useValue: campaignsApi },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignsNewPageComponent);
    component = fixture.componentInstance;
    await Promise.resolve();
  });

  it('creates then dispatches campaign in sequence', async () => {
    component.form.patchValue({ name: 'Launch', templateId: 'tpl-1', versionNumber: 2, recipientMode: 'all' });

    await component.sendNow();

    expect(campaignsApi.createCampaign).toHaveBeenCalledTimes(1);
    expect(campaignsApi.dispatchCampaign).toHaveBeenCalledWith('cmp-1');
    expect(campaignsApi.rememberCampaign).toHaveBeenCalledWith('cmp-1', 'Launch');
    expect(router.navigate).toHaveBeenCalledWith(['/app/campaigns', 'cmp-1']);
  });

  it('builds version options from published template versions', () => {
    component.form.patchValue({ templateId: 'tpl-1' });

    expect(component.versionOptions()).toEqual([
      { label: 'v2', value: 2 },
      { label: 'v1', value: 1 },
    ]);
  });

  it('enables send when all required values and contacts are available', async () => {
    component.form.patchValue({
      name: 'Launch',
      templateId: 'tpl-1',
      versionNumber: 2,
      recipientMode: 'all',
    });

    await fixture.whenStable();

    expect(component.cannotSend()).toBe(false);
  });

  it('updates send state when switching to manual mode without recipients', async () => {
    component.form.patchValue({
      name: 'Launch',
      templateId: 'tpl-1',
      versionNumber: 2,
      recipientMode: 'all',
    });

    await fixture.whenStable();
    expect(component.cannotSend()).toBe(false);

    component.form.patchValue({ recipientMode: 'manual', manualRecipientIds: [] });
    await fixture.whenStable();
    expect(component.cannotSend()).toBe(true);

    component.form.patchValue({ manualRecipientIds: ['contact-1'] });
    await fixture.whenStable();
    expect(component.cannotSend()).toBe(false);
  });

  it('submits all loaded contact ids when recipient mode is all', async () => {
    component.form.patchValue({ name: 'Launch', templateId: 'tpl-1', versionNumber: 2, recipientMode: 'all' });

    await component.sendNow();

    expect(campaignsApi.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_ids: ['contact-1', 'contact-2'],
      }),
    );
  });

  it('submits only selected contact ids when recipient mode is manual', async () => {
    component.form.patchValue({
      name: 'Launch',
      templateId: 'tpl-1',
      versionNumber: 2,
      recipientMode: 'manual',
      manualRecipientIds: ['contact-2'],
    });

    await component.sendNow();

    expect(campaignsApi.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_ids: ['contact-2'],
      }),
    );
  });

  it('does not dispatch when create fails', async () => {
    campaignsApi.createCampaign.mockReturnValue(throwError(() => new Error('create failed')));
    campaignsApi.dispatchCampaign.mockClear();
    component.form.patchValue({ name: 'Launch', templateId: 'tpl-1', versionNumber: 2, recipientMode: 'all' });

    await component.sendNow();

    expect(campaignsApi.dispatchCampaign).not.toHaveBeenCalled();
    expect(component.stepError()).toBe('Campaign creation failed. Dispatch was not executed.');
  });

  it('shows clear error when dispatch fails after create', async () => {
    campaignsApi.createCampaign.mockReturnValue(
      of({
        data: {
          id: 'cmp-1',
          name: 'Launch',
          status: 'draft',
          template_id: 'tpl-1',
          template_version_id: 'tv-1',
          recipient_count: 2,
        },
      }),
    );
    campaignsApi.dispatchCampaign.mockReturnValue(throwError(() => new Error('dispatch failed')));
    component.form.patchValue({ name: 'Launch', templateId: 'tpl-1', versionNumber: 2, recipientMode: 'all' });

    await component.sendNow();

    expect(campaignsApi.createCampaign).toHaveBeenCalledTimes(1);
    expect(campaignsApi.dispatchCampaign).toHaveBeenCalledWith('cmp-1');
    expect(component.stepError()).toBe('Campaign was created, but dispatch failed. Retry from backend tools.');
  });
});
