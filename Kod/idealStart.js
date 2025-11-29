/// <reference path="idealShared.js"/>
/// <reference path="../Konfiguracja.js"/>
"use strict";

const newTab = (obejście_długości_nawigacji || history.length === 1 || (history.length === 2 && document.referrer === ""));
const singleImageSite = document.contentType.startsWith("image");

if (!czy_wyłączyć_rozszerzenie && automatyczne_pobieranie_w_nowej_karcie && newTab && singleImageSite) {
	chrome.runtime.sendMessage({ imgSrc: location.href, closeThis: automatyczne_zamykanie_kart });
	czy_wyłączyć_rozszerzenie = true;
}
