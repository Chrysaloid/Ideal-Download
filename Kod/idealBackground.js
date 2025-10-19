"use strict";

importScripts("idealShared.js");

function handleDataUrl(dataUrl, req) {
	return chrome.downloads.download({
		filename: determineFileName(dataUrl, req),
		url: dataUrl.dataUrl,
	});
}

chrome.runtime.onMessage.addListener(async function (req, sender, sendResp) {
	if (req.closeThis) {
		chrome.tabs.remove(sender.tab.id);
	} else {
		try {
			if (req.czyPobrać) {
				sendResp(await handleDataUrl({ dataUrl: req.dataUrl }, req));
			} else {
				const resp = await fetch(req.imgSrc);
				respOK(resp);
				const blob = await resp.clone().blob();
				req.blobType = blob.type; // eslint-disable-line require-atomic-updates
				req.czyWebpAnim = blob.type === "image/webp" && await isWebpAnimated(resp); // eslint-disable-line require-atomic-updates
				const dataUrl = await blobToBase64(blob);
				sendResp(await handleDataUrl({ dataUrl }, req));
			}
		} catch (err) {
			sendResp(err.message);
		}
	}

	return true;
});

