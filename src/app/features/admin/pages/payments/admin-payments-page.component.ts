import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AdminActionBarComponent } from '../../../../shared/admin-ui/action-bar/admin-action-bar.component';
import { AdminBadgeComponent } from '../../../../shared/admin-ui/badge/admin-badge.component';
import { AdminButtonComponent } from '../../../../shared/admin-ui/button/admin-button.component';
import { AdminCardComponent } from '../../../../shared/admin-ui/card/admin-card.component';
import { AdminLoadingStateComponent } from '../../../../shared/admin-ui/loading-state/admin-loading-state.component';
import { AdminPageHeaderComponent } from '../../../../shared/admin-ui/page-header/admin-page-header.component';
import { AdminPaymentsService } from '../../services/admin-payments.service';

@Component({
  selector: 'app-admin-payments-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdminActionBarComponent,
    AdminBadgeComponent,
    AdminButtonComponent,
    AdminCardComponent,
    AdminLoadingStateComponent,
    AdminPageHeaderComponent,
  ],
  templateUrl: './admin-payments-page.component.html',
  styleUrl: './admin-payments-page.component.scss',
})
export class AdminPaymentsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentsService = inject(AdminPaymentsService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly serverError = signal('');
  readonly toastMessage = signal('');
  readonly initialSnapshot = signal('');

  readonly form = this.fb.nonNullable.group({
    cashOnDelivery: [true],
    onlineCard: [false],
    bankTransfer: [true],
  });

  readonly hasChanges = computed(() => this.initialSnapshot() !== JSON.stringify(this.form.getRawValue()));

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const settings = await this.paymentsService.getSettings();
      this.form.patchValue(settings.payments);
      this.initialSnapshot.set(JSON.stringify(this.form.getRawValue()));
    } catch {
      this.serverError.set('Nu am putut incarca metodele de plata.');
    } finally {
      this.loading.set(false);
    }
  }

  async save(): Promise<void> {
    const values = this.form.getRawValue();
    if (!values.cashOnDelivery && !values.onlineCard && !values.bankTransfer) {
      this.serverError.set('Activeaza cel putin o metoda de plata.');
      return;
    }

    this.saving.set(true);
    this.serverError.set('');

    try {
      await this.paymentsService.updateSettings({ payments: values });
      this.initialSnapshot.set(JSON.stringify(values));
      this.toastMessage.set('Configurarile de plata au fost salvate.');
    } catch {
      this.serverError.set('Nu am putut salva metodele de plata.');
    } finally {
      this.saving.set(false);
    }
  }
}
