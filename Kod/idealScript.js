/// <reference path="idealShared.js"/>
/// <reference path="../Konfiguracja.js"/>
"use strict";
(() => {
	if (czy_wyłączyć_rozszerzenie || document.documentElement.tagName !== "HTML") return;

	let currImg, przycisk, singleImage, singleImageSite;

	HTMLCollection.prototype.forEach = Array.prototype.forEach;
	NodeList.prototype.forEach = Array.prototype.forEach;

	function clamp(num, min, max) {
		return Math.min(Math.max(num, min), max);
	}
	async function downloadImg(img) {
		return chrome.runtime.sendMessage({
			imgSrc: img.currentSrc,
			imgAlt: img.alt,
			imgTitle: img.title,
		});
	}

	/*
	0 1 2
	3 4 5
	6 7 8
	*/
	const getPoint = [
		/* eslint-disable */
		imgRect => [scrollX +  imgRect.left                     , scrollY +  imgRect.top                      ],
		imgRect => [scrollX + (imgRect.left + imgRect.right) / 2, scrollY +  imgRect.top                      ],
		imgRect => [scrollX +  imgRect.right                    , scrollY +  imgRect.top                      ],
		imgRect => [scrollX +  imgRect.left                     , scrollY + (imgRect.top + imgRect.bottom) / 2],
		imgRect => [scrollX + (imgRect.left + imgRect.right) / 2, scrollY + (imgRect.top + imgRect.bottom) / 2],
		imgRect => [scrollX +  imgRect.right                    , scrollY + (imgRect.top + imgRect.bottom) / 2],
		imgRect => [scrollX +  imgRect.left                     , scrollY +  imgRect.bottom                   ],
		imgRect => [scrollX + (imgRect.left + imgRect.right) / 2, scrollY +  imgRect.bottom                   ],
		imgRect => [scrollX +  imgRect.right                    , scrollY +  imgRect.bottom                   ],
		/* eslint-enable */
	];
	function imageOK() {
		if (currImg.currentSrc.trim()) {
			return true;
		} else {
			for (const point of getPoint) {
				const elemArr = document.elementsFromPoint(...point(przycisk.getBoundingClientRect()));
				for (const elem of elemArr) {
					if (elem instanceof HTMLImageElement && elem.currentSrc.trim()) {
						currImg = elem;
						return true;
					}
				}
			}
			return false;
		}
	}
	async function downloadImgOuter() {
		if (imageOK()) {
			const possibleError = await downloadImg(currImg); // downloadId
			if (typeof possibleError === "string") { // error occurred, alt: !Number.isFinite(possibleError)
				alert(possibleError);
				return false;
			}
			// if (singleImageSite) window.close(); // Nie działa bo "Scripts may close only the windows that were opened by them."
			if (singleImageSite) chrome.runtime.sendMessage({ closeThis: true });
			return true;
		} else {
			return false;
		}
	}

	singleImageSite = (
		automatyczne_zamykanie_kart &&
		(obejście_długości_nawigacji || history.length === 1 || (history.length === 2 && document.referrer === "")) && // nowa karta
		(singleImage = document.querySelector(`body>img:only-child`)) !== null
	);
	if (singleImageSite && automatyczne_pobieranie_w_nowej_karcie) {
		currImg = singleImage;
		if (downloadImgOuter()) return;
	}
	przycisk = document.createElement("div");
	przycisk.classList.add("przycisk-do-pobierania-obrazów");
	przycisk.setAttribute("style", `background-image: url('${chrome.runtime.getURL("Kod/icon_128.png").trim()}'); width: ${rozmiar_przycisku}px; height: ${rozmiar_przycisku}px;`);
	przycisk.setAttribute("title", "Download image");
	przycisk.addEventListener("mouseleave", e => { if (e.toElement !== currImg) { przycisk.classList.remove("kursor-nad-obrazem", "zły-rozmiar") } });
	przycisk.addEventListener("click", e => {
		e.stopPropagation();
		downloadImgOuter();
	});
	document.body.appendChild(przycisk);

	// #region //* setPrzyciskPosition
	/* eslint-disable */
	function Top     (imgRect) { return clamp(imgRect.top                                           , 0, document.documentElement.clientHeight - rozmiar_przycisku) + "px"; }
	function TopMid  (imgRect) { return clamp(imgRect.top + imgRect.height/2 - rozmiar_przycisku/2  , 0, document.documentElement.clientHeight - rozmiar_przycisku) + "px"; }
	function Bottom  (imgRect) { return clamp(document.documentElement.clientHeight - imgRect.bottom, 0, document.documentElement.clientHeight - rozmiar_przycisku) + "px"; }
	function Left    (imgRect) { return clamp(imgRect.left                                          , 0, document.documentElement.clientWidth  - rozmiar_przycisku) + "px"; }
	function LeftMid (imgRect) { return clamp(imgRect.left + imgRect.width/2 - rozmiar_przycisku/2  , 0, document.documentElement.clientWidth  - rozmiar_przycisku) + "px"; }
	function Right   (imgRect) { return clamp(document.documentElement.clientWidth - imgRect.right  , 0, document.documentElement.clientWidth  - rozmiar_przycisku) + "px"; }
	/* eslint-enable */
	let setPrzyciskPositionHelper = imgRect0 => {
		setPrzyciskPositionHelper = (() => {
			switch (pozycja_przycisku.findIndex(el => el)) { // znajdź pierwszy element co castuje się na true
				default:
				case 0: return imgRect => {
					przycisk.style.left = Left(imgRect);
					przycisk.style.top = Top(imgRect);
				};
				case 1: return imgRect => {
					przycisk.style.left = LeftMid(imgRect);
					przycisk.style.top = Top(imgRect);
				};
				case 2: return imgRect => {
					przycisk.style.right = Right(imgRect);
					przycisk.style.top = Top(imgRect);
				};
				case 3: return imgRect => {
					przycisk.style.left = Left(imgRect);
					przycisk.style.top = TopMid(imgRect);
				};
				case 4: return imgRect => {
					przycisk.style.left = LeftMid(imgRect);
					przycisk.style.top = TopMid(imgRect);
				};
				case 5: return imgRect => {
					przycisk.style.right = Right(imgRect);
					przycisk.style.top = TopMid(imgRect);
				};
				case 6: return imgRect => {
					przycisk.style.left = Left(imgRect);
					przycisk.style.bottom = Bottom(imgRect);
				};
				case 7: return imgRect => {
					przycisk.style.left = LeftMid(imgRect);
					przycisk.style.bottom = Bottom(imgRect);
				};
				case 8: return imgRect => {
					przycisk.style.right = Right(imgRect);
					przycisk.style.bottom = Bottom(imgRect);
				};
			}
		})();
		setPrzyciskPositionHelper(imgRect0);
	};
	function setPrzyciskPosition() {
		const imgRect = currImg.getBoundingClientRect();
		setPrzyciskPositionHelper(imgRect);
		return imgRect;
	}
	// #endregion

	const klawCtrl = "klawisz-kontrol", ctrl = "Control"; const bod = document.body.classList;
	document.addEventListener("keydown", e => { if (e.key === ctrl) bod.add   (klawCtrl); }); // eslint-disable-line func-call-spacing
	document.addEventListener("keyup"  , e => { if (e.key === ctrl) bod.remove(klawCtrl); }); // eslint-disable-line comma-spacing

	if (użyj_metody_mousemove) {
		const maxThrottle = 4; // ilukrotnie zmniejszyć częstotliwość eventów
		let throttle = maxThrottle - 1;
		document.addEventListener("mousemove", function (e) {
			if ((throttle = (throttle + 1) % maxThrottle) !== 0) return;

			przycisk.classList.remove("kursor-nad-obrazem", "zły-rozmiar");
			const elemArr = document.elementsFromPoint(e.clientX, e.clientY);
			for (let i = 0; i < elemArr.length; i++) { // Image did not fail to load
				if (elemArr[i].tagName === "IMG" && (this.naturalWidth > 0 || !this.complete)) {
					currImg = elemArr[i];
					const imgRect = setPrzyciskPosition();
					if (imgRect.width < minimalny_rozmiar_obrazu && imgRect.height < minimalny_rozmiar_obrazu) przycisk.classList.add("zły-rozmiar");
					if (e.ctrlKey) { bod.add(klawCtrl) } else { bod.remove(klawCtrl) }
					przycisk.classList.add("kursor-nad-obrazem");
					document.addEventListener("scroll", setPrzyciskPosition);
					return;
				}
			}
			document.removeEventListener("scroll", setPrzyciskPosition);
		});
	} else {
		function imgEnter(e) { //                                  Image failed to load
			if ((e.fromElement === przycisk && this === currImg) || (this.naturalWidth === 0 && this.complete)) return;
			currImg = this;
			const imgRect = setPrzyciskPosition();
			if (imgRect.width < minimalny_rozmiar_obrazu && imgRect.height < minimalny_rozmiar_obrazu) przycisk.classList.add("zły-rozmiar");
			if (e.ctrlKey) { bod.add(klawCtrl) } else { bod.remove(klawCtrl) }
			przycisk.classList.add("kursor-nad-obrazem");
			document.addEventListener("scroll", setPrzyciskPosition);
		}
		function imgLeave(e) {
			if (e.toElement === przycisk) return;
			przycisk.classList.remove("kursor-nad-obrazem", "zły-rozmiar");
			document.removeEventListener("scroll", setPrzyciskPosition);
		}
		function przygotujObraz(img) {
			img.addEventListener("mouseenter", imgEnter);
			img.addEventListener("mouseleave", imgLeave);
		}

		document.body.getElementsByTagName("img").forEach(przygotujObraz);

		new MutationObserver(mutRecArr => {
			mutRecArr.forEach(mutRec => {
				mutRec.addedNodes.forEach(node => {
					if (node.tagName === "IMG") { przygotujObraz(node); return }
					if (node.tagName === undefined) return; // node is a Node and not an Element
					node.getElementsByTagName("img").forEach(przygotujObraz);
				});
			});
		}).observe(document.body, { childList: true, subtree: true });
	}

	const ID_t2 = performance.now(); console.log(`Ideal Download loaded in ${(ID_t2 - ID_t1).toFixed(1)} ms!`);
})();
