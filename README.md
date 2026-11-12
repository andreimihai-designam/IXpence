# Expencer · JARVIS Expense Manager

Aplicație web pentru finanțe personale, în română. HTML, CSS și JavaScript modular, fără build sau backend.

## Pornire

Servește directorul `dist` printr-un server HTTP static, de exemplu:

```sh
python3 -m http.server 8000 --directory dist
```

Deschide `http://localhost:8000`. Modulele JavaScript necesită HTTP; nu deschide direct fișierul HTML prin `file://`.

## Funcționalități

- Buton „Adaugă buget” pe dashboard: salariul este înregistrat ca venit și buget lunar. Poți asocia un venit deja introdus pentru a evita dublarea. Editarea salariului actualizează același venit; ștergerea lui elimină bugetul general asociat, dar păstrează alocările pe categorii.
- Dashboard cu sold disponibil (venituri minus cheltuieli), venituri, cheltuieli și buget rămas.
- Tranzacții: adăugare, editare, ștergere cu confirmare; denumire, sumă, tip, categorie, dată, descriere.
- Buget separat pentru fiecare lună, editabil; 0 înseamnă neconfigurat.
- Rezumat în Categorii: buget total, alocat și rămas de repartizat (buget minus alocări), separat de cheltuieli. Mașină grupează Motorină, Asigurare, ITP, Consumabile, Parcare și Reparații; bugetul grupului este calculat din subcategorii și nu este numărat de două ori. Călătorii și Evenimente sunt categorii separate. Datele vechi de Transport / Motorină sunt păstrate în subcategoria Motorină.
- Bugete lunare pe categorii, introduse de utilizator în Categorii, cu progres, cheltuit și rămas. La Datorii se urmărește suma planificată pentru plata lunii, nu soldul total al împrumuturilor. Bugetele pe categorii nu modifică automat bugetul general.
- Filtrare după lună, căutare în denumire/descriere, categorie și tip; paginare.
- Grafice SVG responsive, fără dependențe externe: cheltuieli zilnice și distribuție pe categorii.
- Categorii implicite și categorii personalizate cu redenumire și ștergere. La ștergerea unei categorii personalizate, tranzacțiile sunt mutate la „Alte cheltuieli”.
- Export CSV al selecției filtrate, al lunii sau al tuturor tranzacțiilor; codificare UTF-8 și protecție împotriva formulelor în celule.
- Dark/Light Mode, sidebar restrâns și navigare mobilă.
- Persistență în `localStorage` (cheia `jarvis-expencer-v1`). Datele nu sunt trimise la server.
- Stare inițială goală, cu date demo opționale.

Sumele sunt stocate în bani (numere întregi). „Economii” reprezintă o ieșire din buget în această versiune. Soldul este calculat pentru luna selectată; nu include sold reportat din alte luni. Graficele și cardurile reflectă luna, iar filtrele de categorie/tip/căutare se aplică tabelului și exportului său.

Datele sunt specifice browserului, dispozitivului și adresei aplicației. Ștergerea datelor browserului elimină și tranzacțiile; exportă periodic CSV. Fișierul CSV este un export, nu există încă import sau sincronizare. Când salvarea eșuează, aplicația afișează o eroare și nu confirmă modificarea.

## Structură

- `dist/app.js` — interfață, rutare, formulare, grafice și evenimente.
- `dist/finance.js` — calcule financiare, agregări și export.
- `dist/storage.js` — persistență și date demo.
- `dist/styles.css` — design responsive și teme.
- `dist/assets/` — Inter, Lucide și favicon, servite local.
- `tests/finance.test.js` — teste de calcule, export și persistență.

## Verificare

Node.js 22 sau mai nou:

```sh
npm run check
npm test
```

## Repository

Repository canonic: `andreimihai-designam/Expencer`. Toate modificările ulterioare se păstrează în același repository. Nu include date financiare personale în Git.

## Licențe terțe

Inter: SIL Open Font License 1.1. Lucide: ISC License. Vezi `THIRD_PARTY_LICENSES.md`.

## Structura categoriilor

Mașină (Motorină, Asigurare, ITP, Consumabile, Parcare, Reparații); Divertisment (Evenimente, Ieșiri); Economii (Călătorii, Apartament); Facturi (Abonamente, Contracte); Cumpărături (Alimentație, Diverse); Diverse (Sănătate, Alte cheltuieli); Datorii.

Tranzacțiile și alocările vechi ale categoriilor devenite grupuri sunt păstrate sub identificatorii originali. În luna în care există sume directe pe grup, apare un card „Alocare anterioară”, pentru ajustare manuală. Aceste sume intră în total o singură dată. Tranzacțiile noi folosesc subcategoriile, iar filtrele pe grup includ subcategoriile și tranzacțiile anterioare.

## Bonuri de masă și resetări

Cardul Bonuri de masă păstrează un total lunar separat de salariu. Diferențele de credit sunt alocate doar la Alimentație; în formularul acestei subcategorii poți ajusta alocarea din bonuri. Nicio altă categorie nu poate primi sau cheltui bonuri. Tranzacțiile au sursa Bani sau Bonuri de masă; plățile mixte se introduc ca două tranzacții. Soldul și bugetul salarial scad doar cu plățile din bani, iar totalul cheltuielilor și graficele includ ambele surse. Nu există report automat între luni. Exportul CSV include sursa plății.

Iconița de resetare din antet resetează alocările lunii selectate, fără să șteargă tranzacțiile. La un grup resetează toate subcategoriile și alocările vechi directe. La Alimentație sau Cumpărături se resetează și alocarea din bonuri; valoarea bonurilor primite și plățile rămân salvate, iar bonurile nealocate pot fi realocate numai la Alimentație.
