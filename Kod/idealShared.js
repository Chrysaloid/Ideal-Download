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
function respOK(resp) {
	if (resp.ok) {
		return resp;
	} else {
		throw new Error("Network response was not ok");
	}
}
async function isWebpAnimated(resp) {
	const buffer = new Uint8Array(await resp.arrayBuffer());
	if (new TextDecoder().decode(buffer.subarray(12, 16)) === "VP8X") {
		return Boolean((buffer[20] >> 1) & 1);
	}
	return false;
}
function determineFileName(dataUrl, obj) {
	// debugger;
	let fileName, pos, altOrTitle;
	let nazwa = (() => {
		altOrTitle = obj.imgAlt.trim();   if (altOrTitle.length) return altOrTitle;
		altOrTitle = obj.imgTitle.trim(); if (altOrTitle.length) return altOrTitle;

		[fileName, pos] = getFileNameFromPathname(obj.imgSrc);
		if (fileName !== null && fileName !== "") return getNameFromFileName(fileName, pos);

		dateFormatter ??= getDateFormatter();

		return "Unknown " + dateFormatter.format(new Date()).replaceAll(":", "꞉");
	})().trim().replaceAll(/[\\\/:*?"<>|\n\r]/gm, "_"); // eslint-disable-line no-useless-escape

	nazwa += (() => { // extension
		const imgForm = (() => {
			if (obj.czyWebpAnim) return "webpAnim";
			if (obj.blobType !== undefined && obj.blobType.startsWith("image/")) {
				// 6 === "image/".length
				return obj.blobType.slice(6);
			}
			if (fileName !== null) {
				if (fileName !== undefined) return getExtFromFileName(fileName, pos);
				[fileName, pos] = getFileNameFromPathname(obj.imgSrc);
				if (fileName !== null) return getExtFromFileName(fileName, pos);
			}
		})();
		/* eslint-disable */
		switch (imgForm) {
			case "jpeg"    : return obj.altKey ? ".png"  : ".jpg";
			case "png"     : return obj.altKey ? ".jpg"  : ".png";
			case "gif"     : return obj.altKey ? ".apng" : ".gif";
			default        :
			case "webp"    : if (obj.altKey) { modifyDataUrl(dataUrl, "jpeg"); return ".jpg" } else { modifyDataUrl(dataUrl, "png" ); return ".png" }
			case "webpAnim":
			case "apng"    : if (obj.altKey) { modifyDataUrl(dataUrl, "apng"); return ".apng" } else { modifyDataUrl(dataUrl, "gif" ); return ".gif" }
			case "jfif"    :
			case "bmp"     :
			case "heic"    :
			case "tiff"    : if (obj.altKey) { modifyDataUrl(dataUrl, "png"); return ".png" } else { modifyDataUrl(dataUrl, "jpeg" ); return ".jpg" }
			case "svg+xml" : return ".svg";
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
