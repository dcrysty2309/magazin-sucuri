# Roadmap Proiect

## Faza 1 - Structura proiectului

Obiectiv:
definirea fundatiei tehnice a aplicatiei.

Include:

- initializare arhitectura Angular
- organizare foldere pe `core`, `shared`, `features`, `layout`
- configurare routing principal
- creare layout pentru storefront
- creare layout pentru admin
- creare layout pentru auth
- creare pagini placeholder
- configurare SCSS global

Nu include:

- backend
- integrare API
- checkout functional
- logica de business finala
- design final

## Faza 2 - UI Shop

Obiectiv:
implementarea interfetei publice vazute de clienti.

Include:

- top bar
- header
- hero section
- homepage sections
- footer
- listare produse
- card produs
- pagina detalii produs
- cos

Pentru aceasta faza:

- se pot folosi date statice sau mock
- componentele trebuie sa fie reutilizabile
- designul trebuie sa respecte directia vizuala a brandului
- homepage-ul trebuie implementat conform referintei din `design/Screenshot 2026-03-12 at 15.28.36.png`

## Faza 3 - UI Admin

Obiectiv:
implementarea interfetei de administrare.

Include:

- admin login UI
- dashboard shell
- navigatie admin
- pagina produse
- pagina categorii
- pagina comenzi
- pagina clienti
- pagina stoc
- pagina promotii
- pagina setari

Nu include inca:

- operatii CRUD reale
- upload real
- conectare reala la baza de date

## Faza 4 - Backend si baza de date

Obiectiv:
construirea stratului de date si a API-ului.

Include:

- setup backend API
- modelare baza de date
- autentificare
- CRUD produse
- CRUD categorii
- gestiune comenzi
- gestiune utilizatori
- gestiune stoc
- upload imagini

## Faza 5 - Integrare frontend-backend

Obiectiv:
conectarea UI-ului la date reale.

Include:

- incarcare produse din API
- adaugare in cos
- persistenta cos
- creare comanda
- autentificare reala
- conectare panou admin la operatiile reale

## Faza 6 - Finisare si optimizare

Obiectiv:
pregatirea aplicatiei pentru utilizare reala.

Include:

- responsive complet
- validari
- optimizare performanta
- upload imagini imbunatatit
- tratare erori
- empty states
- loading states
- securizare acces admin
- polish vizual final

## Mod de lucru recomandat cu Codex

Pentru fiecare task nou:

1. specifica exact ce faza se implementeaza
2. spune clar ce fisiere sau zone pot fi modificate
3. spune explicit ce nu trebuie implementat
4. cere componente reutilizabile si arhitectura curata
5. cere un rezumat final al modificarilor

## Exemplu de task bun pentru Faza 1

```text
Citeste PROJECT_OVERVIEW.md, ARCHITECTURE.md, ROADMAP.md si DESIGN_NOTES.md.

Implementeaza doar Faza 1:
- structura initiala Angular
- layout-uri principale
- routing principal
- pagini placeholder
- setup SCSS global

Nu implementa backend.
Nu implementa business logic.
Nu implementa designul final.

La final, rezuma ce ai creat.
```

## Exemplu de task bun pentru homepage

```text
Implementeaza doar homepage-ul storefront pe baza documentatiei si a referintelor vizuale din folderul design.

Creeaza componente reutilizabile pentru:
- top bar
- header
- hero section
- featured products
- benefits section
- footer

Foloseste Angular, TypeScript si SCSS.
Foloseste continut static temporar.

Nu conecta backend-ul.
Nu implementa checkout-ul.
Nu implementa logica finala de cos.
```

## Ce inseamna Faza 1 pentru acest proiect

Faza 1 nu inseamna designul final al magazinului.
Faza 1 inseamna pregatirea fundatiei tehnice pe care se va construi ulterior UI-ul din Figma.

Pentru proiectul curent, Faza 1 presupune:

- initializarea aplicatiei Angular
- definirea structurii de directoare pentru `core`, `shared`, `features` si `layout`
- separarea clara intre zona publica si zona de admin
- configurarea routing-ului principal pentru storefront, auth, cart, checkout, account si admin
- crearea layout-urilor de baza:
  - `StorefrontLayoutComponent`
  - `AdminLayoutComponent`
  - `AuthLayoutComponent`
- crearea paginilor placeholder pentru rutele principale
- configurarea fisierelor SCSS globale:
  - variabile
  - tipografie
  - reset
  - utilitare
- pregatirea asset-urilor si a conventiilor de stil

Faza 1 nu include:

- implementarea homepage-ului final din Figma
- componente vizuale rafinate pentru hero sau carduri de produs
- integrarea cu backend-ul
- modele de date finale in frontend
- autentificare functionala
- checkout functional
- CRUD admin

Rezultatul asteptat dupa Faza 1:

- proiectul poate fi pornit
- rutele principale exista
- fiecare zona are layout-ul ei
- exista o baza SCSS coerenta
- structura este pregatita pentru implementarea Fazei 2
