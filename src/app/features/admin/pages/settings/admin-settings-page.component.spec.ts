import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DEFAULT_STORE_SETTINGS, StoreSettings } from '../../../../core/models/settings.model';
import { SettingsService } from '../../../../core/services/settings.service';
import { AdminSettingsPageComponent } from './admin-settings-page.component';

class SettingsServiceStub {
  settings: StoreSettings = structuredClone(DEFAULT_STORE_SETTINGS);
  getSettings = jasmine.createSpy('getSettings').and.callFake(async () => structuredClone(this.settings));
  updateSettings = jasmine.createSpy('updateSettings').and.callFake(async (settings: StoreSettings) => {
    this.settings = structuredClone(settings);
    return structuredClone(this.settings);
  });
}

describe('AdminSettingsPageComponent', () => {
  let settingsService: SettingsServiceStub;

  beforeEach(async () => {
    settingsService = new SettingsServiceStub();

    await TestBed.configureTestingModule({
      imports: [AdminSettingsPageComponent],
      providers: [{ provide: SettingsService, useValue: settingsService }],
    }).compileComponents();
  });

  async function createComponent() {
    const fixture = TestBed.createComponent(AdminSettingsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('renders general settings fields and operational side panel', async () => {
    const fixture = await createComponent();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Setari magazin');
    expect(text).toContain('Nume magazin');
    expect(text).toContain('Email');
    expect(text).toContain('Telefon');
    expect(text).toContain('Locatii & taxe');
    expect(text).toContain('TVA (%)');
    expect(text).toContain('Cod postal');
  });

  it('switches between each settings module and displays its controls clearly', async () => {
    const fixture = await createComponent();
    const moduleButtons = fixture.debugElement.queryAll(By.css('.settings-tabs__item'));

    expect(moduleButtons.length).toBe(4);

    moduleButtons[1].nativeElement.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cost livrare');
    expect(fixture.nativeElement.textContent).toContain('Prag livrare gratuita');

    moduleButtons[2].nativeElement.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ramburs');
    expect(fixture.nativeElement.textContent).toContain('Card online');
    expect(fixture.nativeElement.textContent).toContain('Transfer bancar');

    moduleButtons[3].nativeElement.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Meta title');
    expect(fixture.nativeElement.textContent).toContain('Meta description');
    expect(fixture.nativeElement.textContent).toContain('Keywords');
  });

  it('keeps save disabled until valid changes are made', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;
    const saveButton: HTMLButtonElement = fixture.nativeElement.querySelector('.admin-page__actions button');

    expect(component.saveDisabled()).toBeTrue();
    expect(saveButton.disabled).toBeTrue();

    component.form.controls.general.controls.storeName.setValue('Livada Noastra Premium');
    fixture.detectChanges();
    expect(component.saveDisabled()).toBeFalse();

    component.form.controls.general.controls.email.setValue('invalid-email');
    component.form.controls.general.controls.email.markAsTouched();
    fixture.detectChanges();

    expect(component.saveDisabled()).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Introdu un email valid.');
  });

  it('saves through the service and shows confirmation toast', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;

    component.form.controls.general.controls.storeName.setValue('Setari Persistente');
    fixture.detectChanges();

    await component.save();
    fixture.detectChanges();

    expect(settingsService.updateSettings).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Setarile magazinului au fost salvate.');
  });

  it('blocks saving when all payment methods are disabled', async () => {
    const fixture = await createComponent();
    const component = fixture.componentInstance;

    component.form.controls.general.controls.storeName.setValue('Schimbare valida');
    component.form.controls.payments.setValue({
      cashOnDelivery: false,
      onlineCard: false,
      bankTransfer: false,
    });

    await component.save();
    fixture.detectChanges();

    expect(settingsService.updateSettings).not.toHaveBeenCalled();
    expect(component.activeModule()).toBe('payments');
    expect(fixture.nativeElement.textContent).toContain('Activeaza cel putin o metoda de plata.');
  });
});
