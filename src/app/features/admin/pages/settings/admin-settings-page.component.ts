import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SettingsModuleKey, ShippingZone, StoreSettings } from '../../../../core/models/settings.model';
import { SettingsService } from '../../../../core/services/settings.service';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin-settings-page.component.html',
  styleUrl: './admin-settings-page.component.scss',
})
export class AdminSettingsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly activeModule = signal<SettingsModuleKey>('general');
  readonly initialSnapshot = signal('');
  readonly formSnapshot = signal('');
  readonly formInvalid = signal(true);
  readonly shippingZones = signal<ShippingZone[]>([]);

  readonly modules: Array<{ key: SettingsModuleKey; label: string; description: string }> = [
    { key: 'general', label: 'Setari generale', description: 'Brand, contact si identitate vizuala.' },
    { key: 'shipping', label: 'Livrare', description: 'Costuri, prag gratuit si activare serviciu.' },
    { key: 'payments', label: 'Plati', description: 'Metodele afisate clientilor la checkout.' },
    { key: 'seo', label: 'SEO', description: 'Meta date pentru indexare si social preview.' },
  ];

  readonly form = this.fb.nonNullable.group({
    general: this.fb.nonNullable.group({
      storeName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s()-]{8,20}$/)]],
      currency: this.fb.nonNullable.control<'RON' | 'EUR' | 'USD'>('RON', { validators: [Validators.required] }),
      logoUrl: ['', [Validators.required]],
    }),
    shipping: this.fb.nonNullable.group({
      cost: [19, [Validators.required, Validators.min(0)]],
      freeThreshold: [150, [Validators.required, Validators.min(0)]],
      enabled: [true],
    }),
    payments: this.fb.nonNullable.group({
      cashOnDelivery: [true],
      onlineCard: [false],
      bankTransfer: [true],
    }),
    seo: this.fb.nonNullable.group({
      metaTitle: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(70)]],
      metaDescription: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(160)]],
      keywords: ['', [Validators.required, Validators.minLength(5)]],
    }),
    taxes: this.fb.nonNullable.group({
      vatRate: [19, [Validators.required, Validators.min(0), Validators.max(100)]],
      includedInPrice: [true],
    }),
    location: this.fb.nonNullable.group({
      warehouseName: ['', [Validators.required, Validators.minLength(3)]],
      addressLine: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required]],
      county: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z -]{4,10}$/)]],
    }),
  });

  readonly currentSettings = computed(() => JSON.parse(this.formSnapshot() || '{}') as StoreSettings);
  readonly hasChanges = computed(() => this.initialSnapshot() !== this.formSnapshot());
  readonly saveDisabled = computed(() => this.formInvalid() || this.saving() || !this.hasChanges());
  readonly seoDescriptionLength = computed(() => this.form.controls.seo.controls.metaDescription.value.length);
  readonly logoPreview = computed(() => this.form.controls.general.controls.logoUrl.value || '/images/homepage-hero.png');

  constructor() {
    this.syncFormState();
    this.form.valueChanges.subscribe(() => this.syncFormState());
    this.form.statusChanges.subscribe(() => this.syncFormState());
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const settings = await this.settingsService.getSettings();
      this.patchForm(settings);
      this.form.markAsPristine();
      this.syncFormState();
      this.initialSnapshot.set(this.formSnapshot());
    } catch {
      this.serverError.set('Nu am putut incarca setarile magazinului.');
    } finally {
      this.loading.set(false);
    }
  }

  selectModule(moduleKey: SettingsModuleKey): void {
    this.activeModule.set(moduleKey);
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    this.serverError.set('');

    if (this.form.invalid) {
      return;
    }

    if (
      !this.form.controls.payments.controls.cashOnDelivery.value &&
      !this.form.controls.payments.controls.onlineCard.value &&
      !this.form.controls.payments.controls.bankTransfer.value
    ) {
      this.serverError.set('Activeaza cel putin o metoda de plata.');
      this.activeModule.set('payments');
      return;
    }

    this.saving.set(true);

    try {
      const saved = await this.settingsService.updateSettings(this.toSettings());
      this.patchForm(saved);
      this.form.markAsPristine();
      this.syncFormState();
      this.initialSnapshot.set(this.formSnapshot());
      this.showToast('Setarile magazinului au fost salvate.');
    } catch {
      this.serverError.set('Nu am putut salva setarile magazinului.');
    } finally {
      this.saving.set(false);
    }
  }

  async onLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.serverError.set('Logo-ul trebuie sa fie o imagine valida.');
      return;
    }

    const dataUrl = await this.readFileAsDataUrl(file);
    this.form.controls.general.controls.logoUrl.setValue(dataUrl);
    this.form.controls.general.controls.logoUrl.markAsDirty();
    this.showToast('Logo-ul a fost incarcat local. Salveaza pentru a pastra modificarile.');
  }

  controlError(path: 'general.email' | 'general.phone' | 'seo.metaTitle' | 'seo.metaDescription' | 'location.postalCode'): string {
    const control = this.getControl(path);
    if (!control || !control.touched || !control.invalid) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Camp obligatoriu.';
    }

    if (control.hasError('email')) {
      return 'Introdu un email valid.';
    }

    if (control.hasError('pattern')) {
      return path === 'location.postalCode' ? 'Cod postal invalid.' : 'Format invalid.';
    }

    if (control.hasError('minlength')) {
      return 'Textul este prea scurt.';
    }

    if (control.hasError('maxlength')) {
      return 'Textul depaseste limita permisa.';
    }

    return 'Valoare invalida.';
  }

  private getControl(path: string) {
    return this.form.get(path);
  }

  private patchForm(settings: StoreSettings): void {
    this.shippingZones.set(settings.shipping.zones ?? []);
    this.form.patchValue(settings);
  }

  private toSettings(): StoreSettings {
    const raw = this.form.getRawValue();
    return {
      ...raw,
      shipping: {
        ...raw.shipping,
        zones: this.shippingZones(),
      },
    };
  }

  private syncFormState(): void {
    this.formSnapshot.set(JSON.stringify(this.toSettings()));
    this.formInvalid.set(this.form.invalid);
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    window.setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set('');
      }
    }, 2600);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Nu am putut citi fisierul.'));
      reader.readAsDataURL(file);
    });
  }
}
