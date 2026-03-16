# Test Flows

## Scop

Acest document descrie flow-urile care trebuie testate manual, pas cu pas, inainte de lansare.
Ordinea este importanta: incepi cu infrastructura locala, apoi auth, apoi storefront, apoi contul clientului.

## 0. Pornire mediu local

### Servicii necesare

1. Porneste baza de date:
   `npm run db:start`
2. Porneste API-ul de autentificare:
   `npm run api:start`
3. Porneste frontend-ul Angular:
   `npm start -- --host 0.0.0.0`

### Verificari rapide

1. Deschide `http://127.0.0.1:4300/api/health`.
2. Verifica raspunsul.

Rezultat asteptat:
- `ok: true`
- `database: "postgresql"`
- `emailMode: "local-outbox"` sau `resend`, dupa configurare

## 1. Register cu cont nou

### Scop

Verifici ca userul isi poate crea cont si ca datele se scriu in backend-ul real.

### Pasi

1. Deschide `/auth/register`.
2. Completeaza:
   - prenume
   - nume
   - email nou
   - telefon
   - parola valida
   - confirmare parola
3. Bifeaza termenii si conditiile.
4. Apasa `Creeaza cont`.

### Rezultat asteptat

- formularul se trimite cu succes
- apare mesajul de succes
- nu exista erori in consola browser
- in `backend/data/outbox/` apare un email HTML de confirmare

## 2. Validari frontend pe register

### Scop

Verifici ca formularul opreste datele evident invalide inainte sa ajunga la backend.

### Pasi

1. Incearca submit fara sa completezi campurile.
2. Introdu email invalid.
3. Introdu parola sub 8 caractere.
4. Introdu parole diferite in `Parola` si `Confirma parola`.
5. Lasa nebifati termenii.

### Rezultat asteptat

- inputurile invalide sunt marcate corect
- mesajele de eroare sunt clare
- formularul nu se trimite pana cand datele nu sunt valide

## 3. Register cu email deja existent

### Scop

Verifici raspunsul serverului la dublura de email.

### Pasi

1. Creeaza un cont nou.
2. Incearca sa creezi din nou acelasi cont cu acelasi email.

### Rezultat asteptat

- backend-ul raspunde cu eroare controlata
- mesajul afisat este clar: contul exista deja

## 4. Confirmare email

### Scop

Verifici activarea contului prin linkul din email.

### Pasi

1. Deschide ultimul fisier HTML generat in `backend/data/outbox/`.
2. Apasa linkul `Confirma emailul`.

### Rezultat asteptat

- se deschide pagina de confirmare
- contul devine `email verified`
- linkul nu da eroare daca tokenul este valid

## 5. Login blocat inainte de confirmare

### Scop

Verifici ca un cont neconfirmat nu poate intra in sistem.

### Pasi

1. Creeaza un cont nou.
2. Nu confirma emailul.
3. Incearca sa te autentifici din `/auth/login`.

### Rezultat asteptat

- login-ul este refuzat
- mesajul cere confirmarea emailului

## 6. Login cu cont confirmat

### Scop

Verifici flow-ul principal de autentificare.

### Pasi

1. Deschide `/auth/login`.
2. Introdu emailul si parola contului confirmat.
3. Bifeaza sau debifeaza `Tine-ma minte`, dupa caz.
4. Apasa `Autentificare`.

### Rezultat asteptat

- autentificarea reuseste
- userul ajunge in `/account/profil`
- sesiunea este activa in header
- dropdown-ul de cont functioneaza

## 7. Persistenta sesiunii

### Scop

Verifici ca login-ul ramane activ pe navigare si refresh.

### Pasi

1. Dupa login, navigheaza prin:
   - `/`
   - `/produse`
   - `/cart`
   - `/account/profil`
2. Da refresh pe una dintre pagini.

### Rezultat asteptat

- userul ramane logat
- `/api/auth/me` reface starea corect
- iconul de cont ramane in starea autentificata

## 8. Logout

### Scop

Verifici inchiderea corecta a sesiunii.

### Pasi

1. Logheaza-te.
2. Apasa iconul de cont.
3. Apasa `Deconectare`.
4. Incearca sa deschizi direct `/account/profil`.

### Rezultat asteptat

- sesiunea este stearsa
- headerul revine la starea neautentificata
- ruta de cont este protejata si redirecteaza spre login

## 9. Forgot password

### Scop

Verifici cererea de resetare a parolei.

### Pasi

1. Deschide `/auth/forgot-password`.
2. Introdu emailul unui cont existent.
3. Trimite formularul.

### Rezultat asteptat

- apare mesajul de succes
- in `backend/data/outbox/` se genereaza emailul HTML de resetare

## 10. Reset password

### Scop

Verifici schimbarea efectiva a parolei.

### Pasi

1. Deschide emailul HTML de resetare.
2. Apasa linkul `Reseteaza parola`.
3. Introdu parola noua valida.
4. Trimite formularul.
5. Incearca login cu parola noua.

### Rezultat asteptat

- parola se schimba
- login-ul functioneaza doar cu parola noua
- sesiunile vechi sunt invalidate

## 11. Rate limiting si blocare temporara

### Scop

Verifici protectiile minime de securitate pe login.

### Pasi

1. Ia un cont confirmat.
2. Incearca sa te loghezi cu parola gresita de mai multe ori.

### Rezultat asteptat

- dupa numarul configurat de incercari esuate, contul este blocat temporar
- mesajul mentioneaza blocarea temporara
- login-ul corect nu mai merge pana la expirarea blocarii sau pana la resetare administrativa

## 12. Header si dropdown cont

### Scop

Verifici UX-ul de auth vizibil in storefront.

### Pasi

1. Logheaza-te.
2. Mergi pe homepage.
3. Verifica iconul de cont.
4. Apasa pe icon.
5. Apasa in afara dropdown-ului.

### Rezultat asteptat

- dropdown-ul nu este deschis implicit
- se deschide doar la click
- se inchide la click in afara
- linkurile din dropdown merg corect

## 13. Dashboard cont client

### Scop

Verifici zona `My Account`.

### Pasi

1. Dupa login, intra in:
   - `/account/profil`
   - `/account/comenzi`
   - `/account/adrese`
2. Foloseste meniul lateral din stanga.

### Rezultat asteptat

- meniul lateral este vizibil si coerent
- pagina activa este evidentiata
- linkurile functioneaza
- logout-ul din zona de cont functioneaza

## 14. Adaugare in cos din homepage

### Scop

Verifici CTA-ul principal de shopping.

### Pasi

1. Deschide homepage.
2. Adauga un produs in cos.
3. Verifica badge-ul din header.
4. Deschide mini-cartul.

### Rezultat asteptat

- produsul apare in mini-cart
- badge-ul se actualizeaza
- subtotalul se actualizeaza

## 15. Adaugare in cos din pagina de categorie

### Scop

Verifici catalogul.

### Pasi

1. Deschide `/produse`.
2. Adauga mai multe produse diferite.
3. Verifica badge-ul si mini-cartul.

### Rezultat asteptat

- fiecare produs se adauga corect
- cantitatile si subtotalul sunt corecte

## 16. Pagina cos

### Scop

Verifici fluxul de cos mare.

### Pasi

1. Deschide `/cart`.
2. Modifica cantitatea produselor.
3. Elimina un produs.
4. Verifica totalurile.

### Rezultat asteptat

- cantitatea se actualizeaza corect
- produsul se poate elimina
- totalurile raman coerente

## 17. Persistenta cosului

### Scop

Verifici comportamentul local al cosului.

### Pasi

1. Adauga produse in cos.
2. Da refresh.
3. Inchide si redeschide pagina.

### Rezultat asteptat

- cosul ramane salvat
- mini-cartul si pagina `/cart` raman sincronizate

## 18. Preview emailuri

### Scop

Verifici aspectul emailurilor inainte de providerul real.

### Pasi

1. Deschide:
   - `/preview/emailuri`
   - `/design/email-welcome-preview.html`
   - `/design/email-reset-preview.html`

### Rezultat asteptat

- emailurile sunt lizibile
- butoanele si textele sunt corecte
- stilul este coerent cu brandul

## 19. Mobile si tableta

### Scop

Verifici flow-urile esentiale pe device real.

### Pasi

1. Deschide site-ul pe telefon.
2. Verifica:
   - header
   - meniu mobil
   - icon cont
   - icon cos
   - mini-cart
   - register
   - login
   - forgot password
   - homepage
   - pagina categorie

### Rezultat asteptat

- headerul nu sare la scroll
- meniul mobil se deschide fluid
- contul si cosul sunt usor accesibile
- formularele sunt lizibile si utilizabile

## 20. Checklist minim obligatoriu inainte de live

- PostgreSQL pornit si functional
- `/api/health` raspunde cu `database: postgresql`
- register functioneaza
- confirm email functioneaza
- login functioneaza
- logout functioneaza
- forgot password functioneaza
- reset password functioneaza
- rate limiting si lockout sunt validate
- sesiunile sunt stabile dupa refresh
- header account/cart functioneaza pe desktop si mobile
- cosul functioneaza din homepage, categorie si pagina de produs
- paginile de cont sunt accesibile doar dupa login
- email providerul real este testat separat pe domeniul final
