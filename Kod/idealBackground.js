/// <reference path="idealShared.js"/>
"use strict";

importScripts("idealShared.js");

chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
	chrome.downloads.download({
		filename: determineFileName(req),
		url: req.imgSrc,
		conflictAction: req.conflictAction ?? "uniquify",
	}).then(result => {
		sendResp(result);
		if (req.closeThis) chrome.tabs.remove(sender.tab.id);
	}).catch(err => {
		sendResp(err.message);
		chrome.notifications.create({
			type: "basic",
			title: "Error in idealBackground.js",
			message: err.message,
			iconUrl: chrome.runtime.getURL("Kod/icon_128.png"),
		});
	});

	return true;
});

// Long term cache net rules for images for some domains
chrome.declarativeNetRequest.getDynamicRules().then(oldRules => {
	chrome.declarativeNetRequest.updateDynamicRules({
		removeRuleIds: oldRules.map(rule => rule.id),
		addRules: [
			"files.catbox.moe",
			"static*.e621.net",
			"static*.e926.net",
			"cdn.discordapp.com",
			"media.discordapp.net",
			"media*.tenor.com",
		].map((domain, index) => ({
			id: index + 1,
			priority: 1,
			condition: {
				urlFilter: `||${domain}^`,
				resourceTypes: ["image", "main_frame", "sub_frame", "other"],
				responseHeaders: [{
					header: "Content-Type",
					values: ["*image/*"],
				}],
			},
			action: {
				type: "modifyHeaders",
				responseHeaders: [{
					header: "Cache-Control",
					operation: "set",
					value: "public, max-age=31536000, immutable", // one year cache
				}],
			},
		})),
	});
});

// sleep(1000).then(() => log(new Date()));

// Nie wiem kiedy to się uruchamia :/
// chrome.runtime.onStartup.addListener(() => {
// });
