# Big Bear Cashflow – mobile web / PWA

Statyczna aplikacja mobilna pod GitHub Pages. Korzysta z Supabase wyłącznie do logowania i pobierania aktywnego snapshota.

## Najważniejsze zmiany

- nazwa w całym systemie: **Big Bear Cashflow**
- ekran logowania jako pierwszy ekran
- po logowaniu aplikacja pobiera aktywny snapshot z Supabase
- aplikacja jest tylko do odczytu
- usunięto zapis do Supabase, import JSON i edycję rekordów
- nawigacja jest w menu hamburger zamiast dolnego panelu
- listy są prostymi przewijanymi tabelami
- kliknięcie pozycji otwiera szczegóły tylko do odczytu
- kliknięcie pozycji w cashflow otwiera widok przelewu dla tej operacji
- dodano ikonę aplikacji

## Publikacja na GitHub Pages

Wrzuć zawartość folderu na branch `main` lub `gh-pages`, a potem w ustawieniach repozytorium wybierz `Pages → Deploy from branch`.
