"use strict";

importScripts("idealShared.js");

chrome.runtime.onMessage.addListener(async function (req, sender, sendResp) {
	if (req.closeThis) {
		chrome.tabs.remove(sender.tab.id);
	} else {
		try {
			sendResp(await chrome.downloads.download({
				filename: determineFileName(req),
				url: req.imgSrc,
			}));
		} catch (err) {
			sendResp(err.message);
		}
	}

	return true;
});

