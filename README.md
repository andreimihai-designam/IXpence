# IXpence · Expense Manager

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
- Categorii și subcategorii cu resetarea bugetului, redenumire, adăugare și ștergere. La ștergere, tranzacțiile sunt păstrate fără categorie, iar subcategoriile devin categorii principale.
- Export CSV al selecției filtrate, al lunii sau al tuturor tranzacțiilor; codificare UTF-8 și protecție împotriva formulelor în celule.
- Dark/Light Mode, sidebar restrâns și navigare mobilă.
- Persistență în `localStorage` (cheia `jarvis-expencer-v1`). Datele nu sunt trimise la server.
- Stare inițială goală, cu date demo opționale.

Sumele sunt stocate în bani (numere întregi). „Economii” reprezintă o ieșire din buget în această versiune. Soldul este calculat pentru luna selectată; nu include sold reportat din alte luni. Graficele și cardurile reflectă luna, iar filtrele de categorie/tip/căutare se aplică tabelului și exportului său.

Datele sunt specifice browserului, dispozitivului și adresei aplicației. Ștergerea datelor browserului elimină și tranzacțiile; descarcă periodic un backup JSON complet. CSV rămâne un export al tranzacțiilor, iar restaurarea se face din backup JSON. Nu există sincronizare automată între dispozitive. Când salvarea eșuează, aplicația afișează o eroare și nu confirmă modificarea.

## Structură

- `dist/app.js` — interfață, rutare, formulare, grafice și evenimente.
- `dist/finance.js` — calcule financiare, agregări și export.
- `dist/storage.js` — persistență și date demo.
- `dist/features.js` — copierea bugetelor, favorite, comparații, praguri de avertizare și validarea backupului.
- `dist/styles.css` — design responsive și teme.
- `dist/assets/` — Inter, Lucide și favicon, servite local.
- `tests/finance.test.js` — teste de calcule, export și persistență.
- `tests/features.test.js` — teste pentru cele cinci funcții noi și validarea fișierelor de backup.

## Verificare

Node.js 22 sau mai nou:

```sh
npm run check
npm test
```

## Repository

Repository canonic: `andreimihai-designam/IXpense---Expense-Mangement`. Toate modificările ulterioare se păstrează în același repository. Nu include date financiare personale în Git.

## Licențe terțe

Inter: SIL Open Font License 1.1. Lucide: ISC License. Vezi `THIRD_PARTY_LICENSES.md`.

## Structura categoriilor

Mașină (Motorină, Asigurare, ITP, Consumabile, Parcare, Reparații); Divertisment (Evenimente, Ieșiri); Economii (Călătorii, Apartament); Facturi; Cumpărături (Alimentație, Diverse); Diverse (Sănătate, Alte cheltuieli); Datorii.

Tranzacțiile și alocările vechi ale categoriilor devenite grupuri sunt păstrate sub identificatorii originali. În luna în care există sume directe pe grup, apare un card „Alocare anterioară”, pentru ajustare manuală. Aceste sume intră în total o singură dată. Tranzacțiile noi folosesc subcategoriile, iar filtrele pe grup includ subcategoriile și tranzacțiile anterioare.

## Bonuri de masă și resetări

Cardul Bonuri de masă păstrează un total lunar separat de salariu. Diferențele de credit sunt alocate doar la Alimentație; în formularul acestei subcategorii poți ajusta alocarea din bonuri. Nicio altă categorie nu poate primi sau cheltui bonuri. Tranzacțiile au sursa Bani sau Bonuri de masă; plățile mixte se introduc ca două tranzacții. Soldul și bugetul salarial scad doar cu plățile din bani, iar totalul cheltuielilor și graficele includ ambele surse. Nu există report automat între luni. Exportul CSV include sursa plății.

Iconița de resetare din antet resetează alocările lunii selectate, fără să șteargă tranzacțiile. La un grup resetează toate subcategoriile și alocările vechi directe. La Alimentație sau Cumpărături se resetează și alocarea din bonuri; valoarea bonurilor primite și plățile rămân salvate, iar bonurile nealocate pot fi realocate numai la Alimentație.

În rezumatul de sus al dashboardului există un al cincilea card „Bonuri de masă”, cu totalul primit și soldul disponibil. „Venituri totale” include veniturile în bani plus totalul bonurilor primite în luna selectată. Bonurile sunt adăugate în total o singură dată, fără o tranzacție de venit în bani. Soldul în bani și bugetul salarial rămân calculate separat.

## Logo IXpence

Logoul de referință este reinterpretat în SVG transparent: monede, grafic ascendent, arc turcoaz și inscripția IXpence. `ixpence-logo.svg` este varianta completă, `ixpence-logo-light.svg` adaptează inscripția pentru tema luminoasă, iar `ixpence-icon.svg` este varianta compactă. Faviconul folosește același simbol. SVG-urile sunt autonome, cu litere convertite în trasee, fără fonturi externe.

## GitHub Pages

Workflow-ul `.github/workflows/deploy-pages.yml` verifică aplicația și publică directorul `dist` la fiecare push pe `main`. În repository, GitHub Pages trebuie configurat cu Source: **GitHub Actions** (Settings → Pages). Toate modificările ulterioare se încarcă în același repository `andreimihai-designam/IXpense---Expense-Mangement`.

Datele din browserul de pe adresa Sites nu se mută automat la adresa GitHub Pages. Sunt două origini diferite; descarcă un backup JSON din versiunea actualizată înainte de schimbarea adresei, apoi restaurează-l în Setări la noua adresă. CSV este doar export, nu este acceptat pentru restaurare.

## Adresa publicată

Aplicație: https://andreimihai-designam.github.io/IXpense---Expense-Mangement/

La redenumirea repository-ului se schimbă și calea proiectului GitHub Pages. Vechea cale `/IXpence/` nu este redirecționată automat. Actualizează bookmarkurile la adresa de mai sus.

## Funcții pentru utilizare lunară

- **Copiază luna trecută** în Categorii și Bugete: completează alocările lipsă din banii lunii anterioare. Opțiunea de înlocuire actualizează și alocările acelorași categorii deja configurate. Sunt ignorate categoriile șterse. Nu se copiază salariul, tranzacțiile sau bonurile de masă.
- **Tranzacții favorite** în Dashboard și Tranzacții: steaua din tabel salvează/elimină un model; modelul deschide formularul cu datele precompletate și data din luna selectată. Poți salva un model și prin bifa din formular. Plata se înregistrează doar după confirmarea formularului, folosind validările obișnuite.
- **Avertizări**: la minimum 80% din buget categoria este evidențiată în galben; la 100% sau peste, în roșu, cu mesaj explicit. Bugetul neconfigurat nu are prag procentual. Dashboardul include un rezumat al subcategoriilor care necesită atenție.
- **Față de luna trecută** în Rapoarte: compară lunile calendaristice complete pentru categorii și totalurile grupurilor (aceste rânduri sunt marcate ca total grup și nu trebuie însumate cu subcategoriile). Sunt incluse plățile din bani și bonuri. Când luna anterioară are valoarea 0, diferența procentuală nu este afișată.
- **Backup și restaurare** în Setări: JSON cu toate lunile, tranzacțiile, bugetele, categoriile, bonurile, favoritele și preferințele. Fișierul este validat înainte de orice schimbare; importul înlocuiește datele, nu le combină. Înainte de restaurare se descarcă automat și un backup al stării curente. Limita fișierului importat este 10 MB. Fișierele conțin date personale și se păstrează local, nu se trimit în GitHub.

Verificare: 32 de teste automate și scenarii în browser pentru copiere cu/fără suprascriere, favorite, avertizări, comparație, export, respingerea fișierelor invalide, restaurare într-un context nou de browser și persistență după reîncărcare.

## Calendar, obiective și închiderea lunii

**Bugete → Calendar de facturi** oferă calendarul lunii selectate, filtrare pe zi, totalul de achitat, scadențe depășite și facturi achitate. Facturile sunt introduse manual, cu sumă, categorie și dată scadentă; nu sunt recurente automat. O factură planificată nu modifică soldul. „Achită” înregistrează o singură cheltuială din bani sau asociază o cheltuială existentă, fără duplicare. La asociere se păstrează suma și data tranzacției alese; acestea sunt afișate lângă factura planificată. Ștergerea plății în Tranzacții readuce factura la starea neachitată. Ștergerea facturii păstrează plata. Facturile achitate se corectează din Tranzacții, nu prin modificarea sumei facturii.

**Bugete → Obiective de economisire** permite nume, țintă, categorie și termen opțional. Progresul însumează contribuțiile asociate din toate lunile, nu toate cheltuielile din categoria respectivă. O contribuție nouă este o cheltuială din bani; alternativ poți asocia o cheltuială existentă. Istoricul pe luni arată progresul cumulat. Editarea sau ștergerea tranzacțiilor actualizează progresul. Ștergerea unui obiectiv păstrează tranzacțiile și marcajul istoric de economisire.

**Rapoarte → Închiderea lunii** salvează un rezumat cu veniturile în bani și bonuri, cheltuielile pe surse, soldurile rămase, numărul tranzacțiilor și sumele puse deoparte. Economiile includ contribuții la obiective și ieșiri în categoria Economii/subcategoriile sale, numărate o singură dată. Sunt deja incluse în cheltuieli, deci nu se scad din nou din sold. Închiderea nu blochează editările și nu reportează automat solduri. Dacă valorile lunii se schimbă după închidere, apare un avertisment; „Recalculează închiderea” salvează noul rezumat, iar „Redeschide” elimină doar rezumatul salvat.

Backupul JSON include facturile, obiectivele, asocierile tranzacțiilor și toate rezumatele de închidere. Backupurile anterioare fără aceste câmpuri rămân compatibile. Testele suplimentare sunt în `tests/planning.test.js`; logica este separată în `dist/planning.js`.

## Dashboard simplificat

Dashboardul afișează Sold disponibil în bani (venituri în bani minus plăți din bani), Bonuri de masă și Tranzacții recente. Sub tabel apar numai categoriile principale sub formă de bare colorate: disponibil din alocat, pentru luna selectată. La grupuri sunt însumate alocările și cheltuielile directe și ale subcategoriilor, inclusiv bonurile alocate la Alimentație. Partea colorată a barei reprezintă cât s-a cheltuit, iar în interior este afișată suma încă disponibilă în RON; depășirile rămân afișate ca sume negative, cu bara complet colorată. Culorile barelor diferențiază categoriile și nu modifică datele salvate.

Graficul „Unde se duc banii”, ceilalți indicatori și evoluția cheltuielilor sunt disponibile în Rapoarte. Favoritele rămân în Tranzacții; facturile și obiectivele în Bugete. Calculele și datele financiare existente sunt păstrate.

Selectorul de perioadă este un afișaj text centrat, cu luna în majuscule la 20 pt și anul la 14 pt; săgețile schimbă luna și actualizează toate datele. Butonul global de adăugare a tranzacției a fost mutat în secțiunea Tranzacții recente / Tranzacții. Dashboardul nu mai afișează titlul barelor și textele introductive din tabelul gol.

Dashboardul folosește o singură casetă: soldul în bani este centrat, iar salariul și bonurile primite sunt afișate pe două rânduri în stânga, fără editare în casetă. Pentru rândul Salariu se folosește salariul înregistrat în luna selectată (asociat bugetului sau numit Salariu); în absența lui, se afișează bugetul lunar configurat. Barele au 30 px pe desktop și 15 px la maximum 650 px. Denumirile categoriilor sunt 14 pt / 10 pt. Textul lateral „Alocat” este eliminat; suma rămasă rămâne în bară, iar alocarea completă este disponibilă în descrierea accesibilă.

În caseta de sus, titlul „Sold disponibil” rămâne centrat, iar suma centrală a fost eliminată. Rândurile „Salariu” și „Bonuri” afișează valorile cu cifre mari și moneda RON mică, aliniată pe aceeași linie.

Caseta „Sold disponibil” folosește layoutul ales, varianta 3: salariul dominant în partea stângă (două treimi), bonurile în dreapta cu separator vertical. Eticheta și suma bonurilor au aceeași nuanță turcoaz, adaptată și pentru tema luminoasă. Pe mobil zonele se așază vertical, cu separator orizontal.
