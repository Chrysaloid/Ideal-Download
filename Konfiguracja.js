/* eslint-disable prefer-const */
"use strict";

/* ----- Instrukcja instalacji ----- */
/*
	1. Rozpakować zip do folderu który nie zmieni miejsca w przyszłości (jeżeli zmieni to usunąć rozszerzenie z Chrome i powtórzyć kroki od 3 do końca)
	2. Przejrzeć plik Konfiguracja.js i pozmieniać go wedle uznania
	3. Otworzyć przeglądarkę
	4. Kliknąć w przycisk puzelka a potem "Zarządzaj rozszerzeniami". Alternatywnie wejść w link chrome://extensions/ (lub podobny dla innego Chromium)
	5. Włączyć tryb dewelopera
	6. Kliknąć przycisk "Załaduj rozpakowane"
	7. Znaleźć folder do którego przed chwilą rozpakowano zipa (ten który zawiera manifest.json)
	8. Zatwierdzić wybór folderu
	9. Odświeżyć wszelkie otwarte strony jeśli chcemy aby rozszerzenie na nich działało
	10. Jeżeli od teraz coś zmienimy w Konfiguracja.js to należy kliknąć przycisk ⟳ (Odśwież) na panelu rozszerzenia i odświeżyć stronę której używaliśmy. Należy to robić po każdej zmianie w Konfiguracja.js
	Zalecam zainstalowanie dobrego edytora (takiego co koloruje tekst) do edycji Konfiguracja.js np. Visual Studio Code albo Notepad++
*/

/* ----- Opis ----- */
/*
	- Rozszerzenie wyświetla przycisk nad obrazami (ale tylko po najechaniu myszką), który po naciśnięciu pobiera obraz.
	- Trzymanie klawisza Ctrl powoduje pominięcie warunku rozmiaru
	- Kliknięcie na przycisk przy wciśniętym klawiszu Alt powoduje pobranie obrazu z alternatywnym rozszerzeniem:
		- Rozszerzenie ║ Rozszerzenie
		  domyślne     ║ alternatywne
		  ═════════════╬══════════════
		  .jpg         ║ .png
		  .png         ║ .jpg
		  .gif         ║ .png
		  .svg         ║ .png // To tak nie działa ale zostawiłem for fun
		- Jeżeli algorytmy wykrywania rozszerzenia zawiodą albo wykryte zostanie niefajne rozszerzenie
		  (np. .webp, .jfif (generalnie dowolne inne niż powyższe)) to domyślnie ustawiane jest rozszerzenie .png
	- Rozszerzenie jest w stanie znaleźć lepszą nazwę dla pobranego pliku niż przeglądarka zgodnie z poniższym ciągiem priorytetów.
		- Domyślnie:
			- Atrybut "alt" obrazu (Tekst pokazywany gdy obraz się nie załaduje. Zazwyczaj zawiera dobry opis obrazu)
		- jeżeli nie ma to:
			- Nazwa pliku wyciągnięta jego z adresu URL
		- jeżeli nie ma to:
			- "Unknown " + obecna ładna i czytelna data z dokładnością do sekund np. "2024-06-07 12꞉42꞉01" (to nie są klasyczne dwukropki więc można je wsadzić do nazwy pliku)
	- Rozszerzenie po pobraniu obrazka automatycznie zamknie stronę jeżeli obrazek był jedynym elementem na stronie i został otwarty w nowej karcie.
	  Można to wyłączyć poprzez automatyczne_zamykanie_kart
	  Tą drugą część można kontrolować poprzez obejście_długości_hostorii
	- FAQ:
		- Jeżeli przycisk się nie pokazuje po najechaniu na obraz to najprawdopodobniej obraz ten został dodany do elementu za pomocą właściwości background-image.
		  Implementacja algorytmu który również by nad takimi by wyświetlał jest zbyt zasobo-chłonna.
		  Jeżeli chce się jednak pobrać taki obraz to należy
			- wejść do DevToolsów (Ctrl + Shift + I)
			- znaleźć odpowiedni element (Ctrl + Shift + C)
			- znaleźć regułę CSS w zakładce "Styles" odpowiedzialną za dodanie background-image (można przefiltrować reguły wpisując "background" w pole "Filter")
			- tam prawym na link
			- "Open in new tab"
		  Wtedy to rozszerzenie już zadziała
*/

/*  ----- Wartości domyślne dla wszystkich stron ----- */

// Rozmiar przycisku w pikselach. Domyślnie 48
// Źródłowy obraz ma 128x128 pikseli
let rozmiar_przycisku = 48;

/*
	Warunek rozmiaru:
	Jeżeli
		szerokość obrazu < minimalny_rozmiar_obrazu
		i
		wysokość obrazu < minimalny_rozmiar_obrazu
		i
		klawisz Ctrl puszczony
	wtedy
		nie pokazuj przycisku po najechaniu myszką.

	Więc przycisk zostanie pokazany dla podłużnych obrazów np. 120x80, 50x150
	ale nie zostanie pokazany dla małych obrazów np. 40x40.
	Domyślnie 100
*/
let minimalny_rozmiar_obrazu = 100;

/*
	[
		lewy górny , górny środek, prawy górny ,
		lewy środek, środek      , prawy środek,
		lewy dolny , dolny środek, prawy dolny ,
	]
	Pierwsza napotkana jedynka zostanie użyta.
	Domyślnie lewy górny.
*/
let pozycja_przycisku = [
	1, 0, 0,
	0, 0, 0,
	0, 0, 0,
];

/*
	Główny wyłącznik rozszerzenie. Domyślnie włączone jest na każdej stronie

	Przykładowe wartości:
	let czy_wyłączyć_rozszerzenie = false; // Domyślnie
	let czy_wyłączyć_rozszerzenie = host("example.com");
	let czy_wyłączyć_rozszerzenie = host("example1.com","example2.com"); // Czytać jako: "Wyłączyć rozszerzenie gdy domena strony równa jest dowolnej z wartości w wektorze"
	let czy_wyłączyć_rozszerzenie = hostIncludes("example.com");
	let czy_wyłączyć_rozszerzenie = hostIncludes("example1.com","example2.com"); // Czytać jako: "Gdy domena strony zawiera dowolną z wartość z wektorze"
	let czy_wyłączyć_rozszerzenie = host("example1.com","example2.com") || hostIncludes("example1.com","example2.com");
	let czy_wyłączyć_rozszerzenie = /example/.test(window.location.hostname); // RegEx
	let czy_wyłączyć_rozszerzenie = new URL(window.location.href).searchParams.has("abc"); // wśród parametrów wyszukiwania jest "abc"
	let czy_wyłączyć_rozszerzenie = new URL(window.location.href).searchParams.get("abc") === "value"; // parametr wyszukiwania "abc" jest równy "value"

	Jak się będzie kilka rzeczy w parametrach wyszukiwania sprawdzać to warto przypisać je do zmiennej dla przejrzystości i wydajności
	let params = new URL(window.location.href).searchParams;
	let czy_wyłączyć_rozszerzenie = params.has("abc") || params.get("def") === "value";
*/
let czy_wyłączyć_rozszerzenie = false;

/*
	Jeżeli ustawione na true to wtedy jeżeli otworzyliśmy obraz w nowej karcie (z czarnym tłem) i klikniemy przycisk to strona automatycznie się zamknie po pobraniu obrazu.
	Możliwości detekcji stron takie same jak w przypadku głównego wyłącznika.

	Przykładowe wartości:
	let automatyczne_zamykanie_kart = true; // Domyślnie
	let automatyczne_zamykanie_kart = host("example1.com","example2.com"); // Czytać jako: "Karta zostanie automatycznie zamknięta gdy domena strony równa jest dowolnej z wartości w wektorze" (whitelist)
	Inne określenie na whitelist w tym przypadku może być "Automatycznie zamknięte zostaną tylko konkretne domeny"

	let automatyczne_zamykanie_kart = !(host("example1.com","example2.com")); // Czytać jako: "Karta zostanie automatycznie zamknięta gdy domeny strony nie ma w wektorze" (blacklist)
	Inne określenie na blacklist w tym przypadku może być "Automatycznie zamknięte zostaną wszystkie domeny oprócz konkretnych"

	let automatyczne_zamykanie_kart = !(hostIncludes("example1.com","example2.com")); // Czytać jako: "Domena nie może zawierać żadnej z wartości aby zostać zamknięta"
*/
let automatyczne_zamykanie_kart = true;

/*
	Jeżeli ustawione na true i automatyczne_zamykanie_kart też jest true to wtedy obraz nie musi już być otwarty w nowej karcie aby strona została automatycznie zamknięta.
	Domyślnie jest tylko w nowej karcie aby umożliwić powrót od obrazu do uprzednio przeglądanej strony (poprzez kliknięcie strzałki w lewo), a z nowej karty i tak nie można wrócić.
	Jednakże czasem chce się pobrać obraz i zostawić go otwartego w nowej karcie. Wtedy trzeba ustawić automatyczne_zamykanie_kart na false dla danej strony (dodać ją w trybie blacklist).
	Jeżeli zdarzyło nam się przez przypadek pobrać i karta się zamknęła to można kliknąć prawym w wolne miejsce na pasku kart i wybrać "Przywróć zamkniętą kartę".
	Możliwości detekcji stron takie same jak w przypadku głównego wyłącznika.

	Przykładowe wartości:
	let obejście_długości_nawigacji = false; // Domyślnie
	let obejście_długości_nawigacji = host("example1.com","example2.com"); // Czytać jako: "Obejście długości nawigacji nastąpi gdy domena strony równa jest dowolnej z wartości w wektorze" (whitelist)
*/
let obejście_długości_nawigacji = hostIncludes("e926.net", "e621.net");

/*
	Jeżeli ustawione na true i automatyczne_zamykanie_kart też jest true to wtedy obrazy otwarte w nowej karcie (z czarnym tłem) zostaną automatycznie pobrane a karta po tym zamnkięta.
	Jeżeli obejście_długości_nawigacji też jest true to gdy klikniemy na obraz to karta się zamknie - to może być nieporządany efekt dlatego należy uważać co mamy w obejście_długości_nawigacji gdy dodajemy coś tutaj.

	Przykładowe wartości:
	let automatyczne_pobieranie_w_nowej_karcie = false; // Domyślnie
	let automatyczne_pobieranie_w_nowej_karcie = host("example1.com","example2.com"); // Czytać jako: "Po otwarciu obrazu w nowej karcie na tych domenach obraz zostanie pobrany a karta zamknięta" (whitelist)
*/
let automatyczne_pobieranie_w_nowej_karcie = hostIncludes("e926.net", "e621.net", "cdn.discordapp.com", "media.discordapp.net");

/*
	Jeżeli ustawione na true to zostanie użyta bardziej wymagająca obliczeniowo metoda mousemove która wysyła event wiele razy na sekundę gdy rusza się mysz.
	Należy jej przynajmniej spróbować gdy domyślna metoda (bazująca na mouseenter i mouseleave) nie działa.
	mouseenter i mouseleave nie działają jeżeli obraz jest przykryty jakimś innym elementem.
*/
let użyj_metody_mousemove = host("allegro.pl", "www.instagram.com", "pl.aliexpress.com", "aliexpress.com");

/*
	Zmienianie wartości domyślnych dla konkretnych stron. Domyślnie nie zmienione.
	Zalecam konstrukcję "if else if". W każdym bloku można zmienić każdą z domyślnych wartości.
	Można użyć tej formy zamiast pisania reguł dla boolowskich zmiennych w ich liniach aby np. poprawić przejrzystość i nie sprawdzać tej samej domeny 2 razy
	Możliwości detekcji stron takie same jak w przypadku głównego wyłącznika.
	Poniższy kod należy skopiować poza komentarz i tam go edytować.

	if (host("example1.com")) {
		rozmiar_przycisku = 30;
		minimalny_rozmiar_obrazu = 80;
		pozycja_przycisku = [
			0, 0, 0,
			0, 0, 1,
			0, 0, 0,
		];
		czy_wyłączyć_rozszerzenie = true; // No, jak się da to jako true to nie ma sensu czegokolwiek innego pisać, ale zostawiam dla pokazu
		automatyczne_zamykanie_kart = false;
		obejście_długości_nawigacji = true;
	} else if (host("example2.com")) {
		// ...
	}
*/
// if (host("allegro.pl")) {
// 	pozycja_przycisku = [
// 		0, 1, 0,
// 		0, 0, 0,
// 		0, 0, 0,
// 	];
// }

/*
	Ukrywanie przycisku dla konkretnych obrazów na konkretnych stronach. Domyślnie pokazywany dla wszystkich obrazów o dobrych rozmiarach.
	Możliwości detekcji stron takie same jak w przypadku głównego wyłącznika.
	Jeżeli obraz spełni warunki selektora to przycisk nie będzie się nad nim wyświetlał (działanie jak blacklist).
	Chyba że zostanie naciśnięty klawisz Ctrl. Wtedy selektor zostanie pominięty.
	Poniższy kod należy skopiować poza komentarz i tam go edytować.

	let selektor_CSSowy;
	if (host("example1.com")) {
		selektor_CSSowy = `
			img.jakaś-klasa,
			img:not([jakiś-atrybut])
		`;
	} else if (host("example2.com")) {
		// działanie jak whitelist
		selektor_CSSowy = `
			img:not(
				img.inna-klasa,
				img[inny-atrybut]
			)
		`;
	} else if (host("example3.com")) {
		// ...
	}
	document.querySelectorAll(selektor_CSSowy).forEach(elem => elem.classList.add("nie-pokazuj-przycisku"));
*/
