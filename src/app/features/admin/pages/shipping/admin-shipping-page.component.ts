import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminFormFieldComponent } from '../../../../shared/admin-ui/form-field/admin-form-field.component';
import { AdminInputDirective } from '../../../../shared/admin-ui/input/admin-input.directive';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminShippingService } from '../../services/admin-shipping.service';

@Component({
  selector: 'app-admin-shipping-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminActionBarComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminFormFieldComponent,
    AdminInputDirective,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-shipping-page.component.html',
  styleUrl: './admin-shipping-page.component.scss',
})
export class AdminShippingPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly shippingService = inject(AdminShippingService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly toastMessage = signal('');
  readonly serverError = signal('');
  readonly initialSnapshot = signal('');

  readonly form = this.fb.nonNullable.group({
    cost: [19, [Validators.required, Validators.min(0)]],
    freeThreshold: [150, [Validators.required, Validators.min(0)]],
    enabled: [true],
    warehouseName: ['', [Validators.required]],
    city: ['', [Validators.required]],
    county: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    zoneNorth: [true],
    zoneNorthEta: [1, [Validators.required, Validators.min(1)]],
    zoneNorthModifier: [0, [Validators.required, Validators.min(0)]],
    zoneSouth: [true],
    zoneSouthEta: [1, [Validators.required, Validators.min(1)]],
    zoneSouthModifier: [0, [Validators.required, Validators.min(0)]],
    zoneEast: [true],
    zoneEastEta: [2, [Validators.required, Validators.min(1)]],
    zoneEastModifier: [4, [Validators.required, Validators.min(0)]],
    zoneWest: [true],
    zoneWestEta: [2, [Validators.required, Validators.min(1)]],
    zoneWestModifier: [2, [Validators.required, Validators.min(0)]],
  });

  readonly hasChanges = computed(() => this.initialSnapshot() !== JSON.stringify(this.form.getRawValue()));

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.serverError.set('');

    try {
      const settings = await this.shippingService.getSettings();
      this.form.patchValue({
        cost: settings.shipping.cost,
        freeThreshold: settings.shipping.freeThreshold,
        enabled: settings.shipping.enabled,
        warehouseName: settings.location.warehouseName,
        city: settings.location.city,
        county: settings.location.county,
        postalCode: settings.location.postalCode,
        zoneNorth: settings.shipping.zones?.[0]?.enabled ?? true,
        zoneNorthEta: settings.shipping.zones?.[0]?.etaDays ?? 1,
        zoneNorthModifier: settings.shipping.zones?.[0]?.priceModifier ?? 0,
        zoneSouth: settings.shipping.zones?.[1]?.enabled ?? true,
        zoneSouthEta: settings.shipping.zones?.[1]?.etaDays ?? 1,
        zoneSouthModifier: settings.shipping.zones?.[1]?.priceModifier ?? 0,
        zoneEast: settings.shipping.zones?.[2]?.enabled ?? true,
        zoneEastEta: settings.shipping.zones?.[2]?.etaDays ?? 2,
        zoneEastModifier: settings.shipping.zones?.[2]?.priceModifier ?? 4,
        zoneWest: settings.shipping.zones?.[3]?.enabled ?? true,
        zoneWestEta: settings.shipping.zones?.[3]?.etaDays ?? 2,
        zoneWestModifier: settings.shipping.zones?.[3]?.priceModifier ?? 2,
      });
      this.initialSnapshot.set(JSON.stringify(this.form.getRawValue()));
    } catch {
      this.serverError.set('Nu am putut incarca setarile de livrare.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.serverError.set('');

    try {
      await this.shippingService.updateSettings({
        shipping: {
          cost: this.form.controls.cost.value,
          freeThreshold: this.form.controls.freeThreshold.value,
          enabled: this.form.controls.enabled.value,
          zones: [
            { id: 'north', name: 'Nord', enabled: this.form.controls.zoneNorth.value, etaDays: this.form.controls.zoneNorthEta.value, priceModifier: this.form.controls.zoneNorthModifier.value },
            { id: 'south', name: 'Sud', enabled: this.form.controls.zoneSouth.value, etaDays: this.form.controls.zoneSouthEta.value, priceModifier: this.form.controls.zoneSouthModifier.value },
            { id: 'east', name: 'Est', enabled: this.form.controls.zoneEast.value, etaDays: this.form.controls.zoneEastEta.value, priceModifier: this.form.controls.zoneEastModifier.value },
            { id: 'west', name: 'Vest', enabled: this.form.controls.zoneWest.value, etaDays: this.form.controls.zoneWestEta.value, priceModifier: this.form.controls.zoneWestModifier.value },
          ],
        },
        location: {
          warehouseName: this.form.controls.warehouseName.value,
          city: this.form.controls.city.value,
          county: this.form.controls.county.value,
          postalCode: this.form.controls.postalCode.value,
        },
      });

      this.initialSnapshot.set(JSON.stringify(this.form.getRawValue()));
      this.toastMessage.set('Setarile de livrare au fost salvate.');
    } catch {
      this.serverError.set('Nu am putut salva setarile de livrare.');
    } finally {
      this.saving.set(false);
    }
  }
}
