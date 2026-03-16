# Prezentare Proiect

## Ce este acest proiect

Acest proiect este o aplicatie e-commerce pentru vanzarea online de sucuri naturale.
Aplicatia va avea doua zone principale:

- zona publica pentru clienti, unde utilizatorii pot descoperi produsele, le pot adauga in cos si pot plasa comenzi
- zona de administrare, unde echipa interna poate gestiona produse, categorii, comenzi, clienti, stocuri si setari

Scopul proiectului este construirea unui magazin online modern, curat si scalabil pentru un brand de sucuri naturale cu pozitionare premium, autentica si romaneasca.

## Obiective principale

- prezentarea clara si eleganta a brandului
- vanzarea online de produse din categoria sucuri naturale
- administrarea simpla a catalogului si a comenzilor
- o arhitectura tehnica usor de extins
- separarea clara intre zona de shop si zona de admin

## Public tinta

- clienti finali care cauta produse naturale si premium
- familii si consumatori interesati de alimentatie curata
- clienti recurenti care doresc comenzi rapide si experienta simpla
- administratorii magazinului, care au nevoie de un panou intern eficient

## Stack tehnologic

Frontend:

- Angular
- TypeScript
- SCSS
- Angular Router
- RxJS

Backend:

- API dedicat pentru autentificare, produse, comenzi si administrare
- recomandat: NestJS

Baza de date:

- baza de date relationala
- recomandat: PostgreSQL

Alte zone importante:

- autentificare cu roluri separate pentru clienti si administratori
- upload de imagini pentru produse
- integrare ulterioara cu sistem de plati

## Zone functionale

### 1. Storefront

Zona publica a aplicatiei, disponibila clientilor:

- homepage
- listare produse
- pagina produs
- cos
- checkout
- autentificare client
- cont client

### 2. Admin Panel

Zona interna a aplicatiei, disponibila administratorilor:

- login admin
- dashboard
- produse
- categorii
- comenzi
- clienti
- stoc
- promotii
- setari

### 3. Backend API

Serviciul care conecteaza frontend-ul cu baza de date:

- autentificare
- CRUD produse
- CRUD categorii
- gestiune comenzi
- gestiune utilizatori
- operatii admin
- upload imagini
- validari si permisiuni

### 4. Database

Structura de date relationala pentru:

- utilizatori
- produse
- categorii
- imagini produse
- cosuri
- comenzi
- adrese
- cupoane

## Principii de produs

- experienta vizuala trebuie sa fie curata, premium si naturala
- interfata magazinului trebuie sa sustina conversia, nu doar prezentarea
- zona de administrare trebuie sa fie rapida, functionala si clara
- componentele trebuie gandite modular si reutilizabil
- proiectul trebuie construit incremental, pe faze

## Stadiu dorit al implementarii

In faza initiala nu se urmareste implementarea logicii complete de business.
Primul obiectiv este definirea arhitecturii aplicatiei, a layout-urilor de baza, a structurii de foldere, a rutelor si a paginilor placeholder.
