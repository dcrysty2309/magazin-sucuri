# Note de Design

## Directie vizuala generala

Brandul trebuie sa transmita imediat:

- natural
- curat
- premium
- autentic
- romanesc

Aplicatia nu trebuie sa para:

- ieftina
- aglomerata
- tip marketplace
- prea decorativa
- prea rustica

Directia corecta este:

- rustic-premium
- clean e-commerce
- clasic elegant, nu ultra-modern rece

## Referinta vizuala curenta

Referinta principala se afla in:

- `design/Design Spec – Livada Noastră.html`
- `design/Screenshot 2026-03-12 at 19.03.30.png`
- `design/Screenshot 2026-03-12 at 19.03.40.png`
- `design/Screenshot 2026-03-12 at 19.03.51.png`
- `design/Screenshot 2026-03-12 at 19.04.06.png`

Aceste fisiere trebuie considerate sursa principala pentru homepage-ul storefront.

Ce se observa clar in designul din Figma:

- header foarte subtire, pe fundal crem deschis
- logo cu icon de mar si wordmark script
- meniu central discret, cu link-uri putine
- iconite de contact/social mici in dreapta
- hero cu fotografie reala mare, nu ilustratie
- textul principal plasat in stanga, peste o zona luminoasa si calma
- produsul principal este ambalajul bag-in-box, mare si dominant
- merele, frunzele, paharul si lemnul sustin autenticitatea vizuala
- banda de beneficii este simpla, aerisita, cu iconite line si text mic
- sectiunea de produse foloseste carduri curate, cu fotografie reala si buton verde discret

Important:

- hero-ul nu trebuie tratat ca o compozitie abstracta sau ilustrativa
- directia corecta este fotografie premium + compozitie editoriala simpla
- atmosfera trebuie sa para calda, naturala, romaneasca si bine executata

## Principii vizuale

- fundaluri calde, crem si luminoase
- text maro inchis, usor cald
- accente verzi naturale
- ton elegant si aerisit
- fotografie mare de produs
- mult spatiu intre elemente
- foarte putin zgomot vizual
- carduri curate, fara elemente agresive

## Paleta de culori

Fundal principal:

- `#F7F0E3`

Fundal secundar:

- `#EDE4D0`

Fundal light sections:

- `#FAF5EA`

Parchment / story:

- `#F5EAD2`

Titluri:

- `#3A2110`

Text normal:

- `#5C3D1E`

Text muted:

- `#8A7060`

Verde principal:

- `#3D6B44`

Verde hover:

- `#2D5234`

Accent tan-gold:

- `#C8A86B`

Rosu mar:

- `#BE3C2F`

Portocaliu suc:

- `#D88B1F`

## Fonturi recomandate

Titlu principal hero si logo:

- `Dancing Script`

Text body, nav, subtitluri, butoane:

- `Lora`

Titluri de sectiune:

- `Playfair Display`

UI tehnic / auxiliar:

- `Inter`

## Reguli de utilizare fonturi

- `Dancing Script` se foloseste pentru hero H1, logo si heading-uri script
- `Lora` se foloseste pentru body text, nav, butoane, subtitluri si etichete
- `Playfair Display` se foloseste pentru titlurile de sectiune cu linii decorative
- `Inter` ramane font utilitar pentru zone tehnice sau auxiliare

## Token-uri de layout confirmate

- hero: `min-height: 520px`
- hero content padding: `24px 60px 70px`
- hero max-width text block: `490px`
- nav padding: `20px 56px`
- section padding: `70px 48px`
- features bar padding: `30px 48px`
- footer padding: `28px 56px`
- produse/story/proces container: `max-width: 1040px`
- features container: `max-width: 900px`
- testimonials container: `max-width: 940px`
- grid produse gap: `22px`
- story gap: `56px`
- section title gap: `20px`
- section title margin-bottom: `44px`

## Structura homepage recomandata

### 1. Header

Headerul trebuie sa fie discret si elegant.

Continut:

- logo in stanga
- meniu central simplu
- iconite mici in dreapta

Meniu recomandat:

- Acasa
- Produse
- Despre noi
- Procesare fructe
- Contact

Caracteristici:

- fundal crem foarte deschis
- separare fina fata de hero
- inaltime mica, aproximativ 60-75px
- aer intre elemente
- iconite discrete pentru contact sau social
- fara aglomerare
- fara butoane mari in header

Stil:

- logo-ul trebuie sa para artizanal-premium
- meniul trebuie sa fie serif sau semi-serif discret
- headerul trebuie sa dea senzatia de brand rafinat, nu de marketplace

### 2. Hero section

Hero-ul trebuie sa fie piesa principala a homepage-ului.

Structura:

- fundal fotografic pe toata latimea sectiunii
- continutul textual grupat in stanga
- produsul dominant in centru-dreapta
- masa de lemn in partea de jos a compozitiei

Text recomandat:

Titlu:

- Suc Natural de Mere, Presat la Rece

Subtitlu:

- 100% natural, fara conservanti. Gust adevarat, direct din livada noastra.

CTA:

- Comanda Acum

Directie vizuala:

- atmosfera calda si premium
- produs dominant
- fundal moale, inspirat din livada
- fotografie reala, soft focus in fundal
- lemn deschis sau masa naturala
- mere, pahar cu suc, bag-in-box
- lumina moale, usor aurie
- fara aspect mecanic sau artificial
- fara compozitii abstracte inutile
- fara stil futurist sau UI rece

Hero-ul din implementare trebuie sa reproduca urmatoarele idei:

- headline mare, elegant, script
- subtitlu scurt pe doua randuri
- buton verde outline
- fotografia trebuie sa faca mare parte din munca emotionala
- overlay-ul de text trebuie sa fie suficient de curat incat mesajul sa ramana lizibil
- partea stanga trebuie sa respire mult
- produsul trebuie sa inspire incredere si calitate

### 3. Banda de beneficii

Sub hero, o sectiune scurta cu 4 beneficii:

- 100% Natural
- Presat la Rece
- Fara Zahar Adaugat
- Ambalaj Bag-in-Box

Stil:

- fundal foarte deschis
- 4 coloane egale
- icon sus, text jos
- linii verticale fine
- aspect elegant si curat
- iconite line, subtiri, monocrome sau verde natural
- text mic, bine spatiat
- container mai ingust: `max-width 900px`

### 4. Produsele Noastre

Titlu centrat cu linii decorative subtile.

Produse recomandate:

- Suc de Mere 3L
- Suc de Mere 5L
- Suc de Mere & Morcov
- Suc de Mere & Sfecla

Card produs:

- imagine produs
- nume
- pret
- buton verde pentru adaugare in cos

Stil card:

- fundal crem deschis
- border foarte fin
- border radius: `12px`
- box shadow: `0 4px 20px rgba(100,60,10,0.10)`
- mult spatiu interior
- fara badge-uri agresive
- fara reduceri stridente
- fotografie reala cu produsul pe fundal cald
- buton verde inchis, curat, cu icon mic discret daca este nevoie
- hover: `translateY(-4px)` cu shadow mai puternic

## Sectiuni confirmate de referinta actuala

Din screenshot-ul curent se confirma clar urmatoarele sectiuni pentru homepage:

- header
- hero
- banda de beneficii
- produse recomandate

Cel mai probabil homepage-ul complet va continua si cu:

- sectiune de poveste / despre livada
- explicarea procesului de obtinere
- testimoniale
- footer

Aceste sectiuni pot fi implementate ulterior, dar primele 4 trebuie tratate ca fundament vizual.

## Directie pentru admin panel

Panoul de administrare nu trebuie sa copieze styling-ul emotional al storefront-ului.

Admin-ul trebuie sa fie:

- clar
- functional
- rapid
- ordonat

Se pot pastra:

- paleta cromatica de baza
- tonul premium discret

Dar interfata admin trebuie sa prioritizeze:

- tabele lizibile
- filtre clare
- formulare bine structurate
- feedback de sistem usor de observat

## Cum trebuie interpretate referintele vizuale

Referintele din folderul `design/` trebuie folosite ca directie de compozitie, ritm, ton si atmosfera.

Nu trebuie copiate mecanic.
Implementarea finala trebuie sa:

- para moderna
- para bine executata
- sustina brandul
- sustina conversia

Totusi, pentru homepage-ul initial, urmatoarele aspecte trebuie urmarite destul de fidel:

- ierarhia sectiunilor
- raportul dintre text si fotografie in hero
- tipul de header discret
- structura pe 4 beneficii
- structura pe 4 carduri de produs
- tonul cromatic general

## Reguli pentru implementare UI

- foloseste componente reutilizabile
- evita decoratiunile inutile
- pastreaza consistenta pe spacing si tipografie
- prioritizeaza produsul si mesajul de brand
- mentine responsive-ul de la inceput
- incepe cu shell-ul paginii, apoi sectiunile, apoi rafinarea vizuala
