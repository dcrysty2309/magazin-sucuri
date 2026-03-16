# Arhitectura Aplicatiei

## Directie generala

Aplicatia este impartita in doua zone clare:

- storefront pentru clienti
- admin panel pentru administrare interna

Aceste doua zone vor folosi aceeasi baza tehnica frontend, dar vor avea layout-uri, rute, componente si reguli de acces separate.

Aplicatia trebuie construita modular, astfel incat fiecare domeniu functional sa fie usor de intretinut si extins.

## Structura recomandata

```text
src/
  app/
    core/
      guards/
      interceptors/
      services/
      models/
      tokens/
    shared/
      components/
      directives/
      pipes/
      ui/
    features/
      storefront/
        pages/
        components/
        services/
        models/
      admin/
        pages/
        components/
        services/
        models/
      auth/
        pages/
        components/
        services/
        models/
      cart/
        pages/
        components/
        services/
        models/
      checkout/
        pages/
        components/
        services/
        models/
      account/
        pages/
        components/
        services/
        models/
    layout/
      storefront-layout/
      admin-layout/
      auth-layout/
    assets/
      images/
      icons/
      fonts/
    styles/
      _variables.scss
      _mixins.scss
      _reset.scss
      _typography.scss
      _utilities.scss
      main.scss
```

## Responsabilitati pe zone

### Core

Contine infrastructura comuna a aplicatiei:

- modele globale
- servicii globale
- configurari
- guards
- interceptors
- token-uri de injectie

Aceasta zona nu trebuie sa contina componente de UI specifice unei pagini.

### Shared

Contine elemente reutilizabile:

- componente comune
- componente de UI
- pipe-uri
- directive
- pattern-uri comune de prezentare

Exemple:

- butoane
- carduri
- input-uri
- badge-uri
- empty states
- loading states

### Features

Fiecare domeniu functional trebuie izolat in propriul modul logic:

- `storefront` pentru paginile publice
- `admin` pentru interfata de administrare
- `auth` pentru login, register, resetare parola
- `cart` pentru cos
- `checkout` pentru fluxul de finalizare comanda
- `account` pentru contul clientului

### Layout

Layout-urile definesc structura vizuala generala pentru fiecare zona:

- `storefront-layout` cu header, footer si continut central
- `admin-layout` cu sidebar, topbar si continut administrativ
- `auth-layout` pentru pagini simple de autentificare

## Routing recomandat

```text
/
  homepage
  produse
  produse/:slug
  despre-noi
  procesare-fructe
  contact

/auth
  login
  register
  forgot-password

/cart

/checkout

/account
  profil
  adrese
  comenzi

/admin
  login
  dashboard
  produse
  categorii
  comenzi
  clienti
  stoc
  promotii
  setari
```

## Strategie de modularizare

- fiecare feature trebuie sa aiba pagini, componente, servicii si modele proprii
- dependintele intre feature-uri trebuie minimizate
- componentele comune merg in `shared`, nu in `features`
- logica infrastructurala merge in `core`
- layout-urile nu trebuie sa contina logica de business

## Strategie de styling

Se va folosi `SCSS` cu organizare pe token-uri si layere:

- variabile globale pentru culori, spatii, umbre, breakpoints
- mixin-uri pentru responsive si pattern-uri repetitive
- tipografie centralizata
- utilitare minimale

Stilurile globale trebuie sa defineasca:

- paleta de culori
- scara de spacing
- fonturile
- stilul butoanelor
- stilul cardurilor
- stilul formularelor

## Principii de dezvoltare

- arhitectura trebuie sa ramana scalabila
- componentele trebuie sa fie mici si reutilizabile
- paginile trebuie compuse din sectiuni clare
- business logic-ul nu trebuie amestecat cu layout-ul
- datele mock trebuie folosite doar temporar in fazele UI
- integrarea cu backend se face dupa finalizarea structurii de baza

## Backend API

Backend-ul va expune endpoint-uri pentru:

- autentificare
- produse
- categorii
- imagini produse
- cos
- checkout
- comenzi
- utilizatori
- administrare

Recomandare:

- NestJS pentru API
- validare DTO
- JWT pentru autentificare
- roluri pentru acces admin versus client

## Model de date recomandat

Entitati de baza:

- `users`
- `products`
- `categories`
- `product_images`
- `orders`
- `order_items`
- `carts`
- `cart_items`
- `addresses`
- `coupons`
- `inventory`

## Ce trebuie facut in faza initiala

In prima faza trebuie implementate doar:

- structura de foldere
- layout-urile principale
- routing-ul principal
- pagini placeholder
- setup-ul SCSS de baza

Nu trebuie implementate inca:

- integrarea backend
- checkout complet
- CRUD real
- autentificare functionala completa
- designul final al fiecarei pagini
