# Admin MVP Backlog

## Faza 1. Curatare si fundatie

### 1.1 Curatare admin existent
- [x] Audit rute, pagini si servicii admin existente
- [x] Scoatere din navigatie a paginilor in afara MVP: analytics, categorii, promotii
- [x] Eliminare rute in afara MVP dupa refactorul dependentelor curente
- [x] Inventar fisiere candidate pentru stergere dupa migrarea pe noua structura
  - `src/app/features/admin/pages/analytics`
  - `src/app/features/admin/pages/categories`
  - `src/app/features/admin/pages/promotions`
  - parti nefolosite din `src/app/core/services/admin.service.ts`

### 1.2 Structura proiect
- [x] Introducere structura modulara pentru admin:
  - `features/admin/products`
  - `features/admin/orders`
  - `features/admin/stock`
  - `features/admin/customers`
  - `features/admin/delivery`
  - `features/admin/payments`
- [ ] Separare `shared/admin-ui` pentru componentele comune
- [x] Separare modele si servicii pe domenii

### 1.3 Shell si design tokens
- [x] Simplificare meniu admin la MVP
- [x] Refacere `admin-layout` intr-un shell modern, aerisit si coerent
- [x] Definire tokens de spacing: `8 / 16 / 24 / 32`
- [ ] Definire baza vizuala comuna: culori, radius, border, shadow, focus

### 1.4 Componente reusable
- [x] `AdminButtonComponent`
- [x] `AdminInputComponent`
- [x] `AdminSelectComponent`
- [x] `AdminTextareaComponent`
- [x] `AdminFormFieldComponent`
- [x] `AdminCardComponent`
- [x] `AdminBadgeComponent`
- [ ] `AdminTableComponent`
- [ ] `AdminTableRowActionsComponent`
- [x] `AdminDialogComponent`
- [ ] `AdminConfirmDialogComponent`
- [x] `AdminEmptyStateComponent`
- [x] `AdminPageHeaderComponent`
- [ ] `AdminLoadingStateComponent`

## Faza 2. Produse
- [x] Mutare produse in modul dedicat
- [x] Lista produse
- [x] Formular adaugare produs
- [x] Formular editare produs
- [x] Stergere produs cu confirm dialog
- [ ] Campuri MVP: nume, pret, stoc, imagine, activ/inactiv

## Faza 3. Comenzi
- [x] Modul comenzi
- [x] Lista comenzi
- [x] Detaliu comanda
- [x] Statusuri MVP: noua, in procesare, livrata
- [ ] Afisare produse, client, telefon, adresa, total

## Faza 4. Stoc
- [x] Modul stoc
- [x] Lista stoc per produs
- [x] Actualizare stoc din admin
- [x] Verificare scadere automata la comanda

## Faza 5. Clienti
- [x] Modul clienti
- [x] Lista clienti
- [x] Detaliu client
- [x] Istoric comenzi per client

## Faza 6. Livrare si plata
- [x] Modul livrare
- [x] Cost livrare
- [x] Prag livrare gratuita
- [x] Zone simple de livrare
- [x] Modul plata
- [x] Ramburs
- [x] Card doar daca ramane simplu si stabil

## Faza 7. Polish si cleanup final
- [x] Uniformizare spacing si aliniere
- [x] Uniformizare tabele, formulare, carduri
- [x] Eliminare cod mort, stiluri moarte si rute nefolosite
- [ ] Verificare responsive
- [x] Verificare fluxuri admin esentiale
