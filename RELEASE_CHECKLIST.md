# Release Checklist

## Obiectiv

Acest document defineste ce trebuie verificat inainte de lansarea magazinului online, astfel incat fluxurile critice sa functioneze stabil si predictibil.

Pentru pasi de testare manuala, in ordine exacta, vezi si [TEST_FLOWS.md](/Users/cristian/projects/magazin-sucuri/TEST_FLOWS.md).

## 1. UI si Responsive

- verifica homepage pe desktop, tableta si mobil
- verifica header sticky, logo, navigatie, cart si account
- verifica mini-cart pe desktop si mobil
- verifica pagina de categorie
- verifica pagina de produs
- verifica pagina de cos
- verifica paginile de autentificare
- verifica footer si link-urile principale
- verifica faptul ca nu exista texte rupte, overlap-uri sau elemente iesite din container

## 2. Fluxuri de cumparare

- adaugare produs in cos din homepage
- adaugare produs in cos din pagina de categorie
- adaugare produs in cos din pagina de produs
- modificare cantitate in mini-cart
- modificare cantitate in pagina de cos
- eliminare produs din mini-cart
- eliminare produs din cos
- persistenta cosului dupa refresh
- redirect corect spre checkout

## 3. Autentificare si cont

- creare cont cu date valide
- validari frontend pe login
- validari frontend pe register
- confirmare parola la register
- mesaj corect dupa register
- login cu user confirmat
- blocare login daca userul nu este confirmat
- forgot password request
- acces la contul meu din header

## 4. Emailuri

### In dezvoltare

- preview mail bun venit
- preview mail resetare parola
- mesaj clar pentru user dupa register
- mesaj clar pentru user dupa forgot password

### Inainte de lansare reala

- alegere provider email tranzactional
- configurare domeniu de trimitere
- configurare SPF
- configurare DKIM
- configurare DMARC
- test inbox Gmail
- test inbox Outlook
- test inbox Yahoo
- verificare spam placement
- verificare link-uri din email
- verificare subiecte si from name

## 5. Backend si date

- endpoint register
- endpoint login
- endpoint confirm email
- endpoint forgot password
- validare date pe backend
- hashing parole
- token confirmare email
- token resetare parola
- gestionare corecta erori API
- fara date sensibile in raspunsurile catre client

## 6. Produse si catalog

- produse vizibile corect in grid
- imagini produse incarcate corect
- preturi consistente
- variante produs corecte
- etichete si badge-uri coerente
- CTA-uri functionale

## 7. Admin

- login admin
- acces restrictionat la rutele admin
- dashboard render corect
- pagini produse/comenzi/clienti functionale la nivel UI

## 8. SEO si continut

- titlu pagina homepage
- meta description homepage
- titluri H1 unice pe pagini importante
- alt text pe imaginile cheie
- link-uri interne functionale

## 9. Securitate minima inainte de launch

- parole hash-uite
- fara secrete in frontend
- variabile sensibile doar in env
- protejare rute admin
- mesaje de eroare fara leakage

## 10. Operatiuni si lansare

- build productie fara erori
- verificare consola browser fara erori critice
- verificare API pornit in productie
- backup baza de date
- monitorizare erori
- plan clar pentru rollback

## 11. Teste recomandate manuale

- register cu email nou
- login cu credentiale corecte
- login cu credentiale gresite
- forgot password
- add to cart cu 3 produse diferite
- update quantity
- remove item
- checkout accesibil
- mini-cart pe mobil
- auth pages pe mobil

## 12. Ce trebuie bifat in mod obligatoriu inainte de lansare

- auth functioneaza cap-coada
- cos functioneaza cap-coada
- emailurile reale sunt testate pe domeniul final
- pagina de categorie si pagina de produs arata corect pe mobil si desktop
- nu exista erori critice in consola sau API
