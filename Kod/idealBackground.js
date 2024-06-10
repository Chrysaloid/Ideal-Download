"use strict";

importScripts("idealShared.js");

function handleDataUrl(dataUrl, req) {
	return chrome.downloads.download({
		filename: determineFileName(dataUrl, req),
		url: dataUrl.dataUrl,
	});
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
	if (req.closeThis) {
		chrome.tabs.remove(sender.tab.id);
	} else {
		/* // Gdy naprawią https://issues.chromium.org/issues/40774955
		fetch(req.imgSrc, { priority: "high" })
		.then(resp => resp.blob())
		.then(blob => URL.createObjectURL(blob))
		.then(dataUrl => {
			chrome.downloads.download({
				url: dataUrl,
				filename: determineFileName(dataUrl, req),
			})
		});
		*/
		/* // Działa ale pobiera obraz za każdym razem
		chrome.downloads.download({
			url: req.imgSrc,
			filename: determineFileName(undefined, req),
		})
		.then(downloadId => sendResp(downloadId))
		*/
		/* Inne rozwiązanie 2
		fetch(req.imgSrc)
		.then(response => response.blob())
		.then(blobToBase64)
		// .then(dataUrl => sendResp(dataUrl)) // Inne rozwiązanie 1
		.then(dataUrl => {
			return chrome.downloads.download({
				url: dataUrl,
				filename: determineFileName(dataUrl, req),
			});
		})
		.then(downloadId => sendResp(downloadId))
		.catch();
		*/

		// Inne rozwiązanie 3
		if (req.czyPobrać) { // eslint-disable-line no-lonely-if
			sendResp(handleDataUrl({ dataUrl: req.dataUrl }, req));
		} else {
			fetch(req.imgSrc)
			.then(response => response.blob())
			.then(blobToBase64)
			.then(dataUrl => handleDataUrl({ dataUrl }, req))
			.then(downloadId => sendResp(downloadId))
			.catch();
		}
	}

	return true;
});

// console.log("Test");

/* onDeterminingFilename nie działa
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
	console.log(downloadItem);
	suggest({ filename: "Test.png" });
});
*/
/*
async function cacheThenNetwork(request) {
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		console.log("Found response in cache:", cachedResponse);
		return cachedResponse;
	}
	console.log("Falling back to network");
	return fetch(request);
}

self.addEventListener("fetch", (e) => {
	console.log(`Handling fetch event for ${e.request.url}`);
	// e.respondWith(cacheThenNetwork(e.request));
});
*/
