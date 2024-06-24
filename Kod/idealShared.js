"use strict";
const ID_t1 = performance.now();

let dateFormatter;
function getDateFormatter() {
	return new Intl.DateTimeFormat("af", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}
function getFileNameFromPathname(src) {
	try {
		const url = new URL(src);
		if (url.protocol !== "data:") {
			const fileName = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
			let pos = fileName.lastIndexOf(".");
			pos = pos === -1 ? fileName.length : pos;
			return [fileName, pos];
		}
	} catch (err) {
		console.log("URL Parse Error: " + err);
	}
	return [null];
}
function getNameFromFileName(fileName, pos) {
	return fileName.slice(0, pos);
}
function getExtFromFileName(fileName, pos) {
	return fileName.slice(pos + 1).toLowerCase();
}
function modifyDataUrl(dataUrl, val) {
	dataUrl.dataUrl = "data:image/" + val + dataUrl.dataUrl.slice(dataUrl.dataUrl.indexOf(";"));
}
// async function isWebpAnimated(resp) {
// 	const data = await resp.text();
// 	if (data.indexOf("ANMF") !== -1) {
// 		return true;
// 	} else {
// 		return false;
// 	}
// }
function determineFileName(dataUrl, obj) {
	// debugger;
	let fileName, pos;
	let nazwa = (() => {
		const trimAlt = obj.imgAlt.trim(); if (trimAlt.length) return trimAlt;

		[fileName, pos] = getFileNameFromPathname(obj.imgSrc);
		if (fileName !== null) return getNameFromFileName(fileName, pos);

		dateFormatter ??= getDateFormatter();

		return "Unknown " + dateFormatter.format(new Date()).replaceAll(":", "꞉");
	})().trim().replaceAll(/[/:*?"<>|\n\r]/gm, "_");

	nazwa += (() => { // extension
		const imgForm = (() => {
			// Sample data URL
			// data:image/jpeg;base64,bvjsb9ouywerthbb
			let dUrl = dataUrl.dataUrl;
			if (dUrl !== undefined) {
				let dataIdx = dUrl.indexOf(",");
				if (dataIdx !== -1) {
					dUrl = dUrl.slice(0, dataIdx);
					dataIdx = dUrl.indexOf("image/");
					if (dataIdx !== -1) {
						//// 11 == 5 + 6 == dataUrl.indexOf("image/") + "image/".length
						// 6 == "image/".length
						return dUrl.slice(dataIdx + 6, dUrl.indexOf(";"));
					}
				}
			}
			if (fileName !== null) {
				if (fileName !== undefined) return getExtFromFileName(fileName, pos);
				[fileName, pos] = getFileNameFromPathname(obj.imgSrc);
				if (fileName !== null) return getExtFromFileName(fileName, pos);
			}
			// return "png";
		})();
		/* eslint-disable */
		if (obj.altKey) {
			switch (imgForm) {
				case "jpeg"   : { modifyDataUrl(dataUrl, "png" ); return ".png" };
				case "png"    : { modifyDataUrl(dataUrl, "jpeg"); return ".jpg" };
				case "gif"    : { modifyDataUrl(dataUrl, "png" ); return ".png" };
				case "svg+xml": { modifyDataUrl(dataUrl, "png" ); return ".png" };
				default       : { modifyDataUrl(dataUrl, "jpeg"); return ".jpg" };
			}
		} else {
			switch (imgForm) {
				case "jpeg"   : {                                return ".jpg" };
				case "png"    : {                                return ".png" };
				case "gif"    : {                                return ".gif" };
				case "svg+xml": {                                return ".svg" };
				default       : { modifyDataUrl(dataUrl, "png"); return ".png" };
			}
		}
		/* eslint-enable */
	})();

	// console.log(nazwa);

	return nazwa;
}
function blobToBase64(blob) {
	const reader = new FileReader();
	reader.readAsDataURL(blob);
	return new Promise(resolve => {
		reader.onloadend = () => {
			resolve(reader.result);
		};
	});
}
const hostname = typeof window !== "undefined" && window.location.hostname;
function host(strList) {
	for (const daElem of strList) {
		if (hostname === daElem) {
			return true;
		}
	}
	return false;
}
function hostIncludes(strList) {
	for (const daElem of strList) {
		if (hostname.includes(daElem)) {
			return true;
		}
	}
	return false;
}
