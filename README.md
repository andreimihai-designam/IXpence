# Expencer · JARVIS Expense Manager

Aplicație web pentru finanțe personale, în română. HTML, CSS și JavaScript modular, fără build sau backend.

## Pornire

Servește directorul `dist` printr-un server HTTP static, de exemplu:

```sh
python3 -m http.server 8000 --directory dist
```

Deschide `http://localhost:8000`. Modulele JavaScript necesită HTTP; nu deschide direct fișierul HTML prin `file://`.

## Funcționalități

- Dashboard cu sold disponibil (venituri minus cheltuieli), venituri, cheltuieli și buget rămas.
- Tranzacții: adăugare, editare, ștergere cu confirmare; denumire, sumă, tip, categorie, dată, descriere.
- Buget separat pentru fiecare lună, editabil; 0 înseamnă neconfigurat.
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
