/*
 * Elasticsearch CSV Exporter
 * v0.1
 * https://github.com/minewhat/es-csv-exporter
 * MIT licensed
 *
 * Copyright (c) 2014-2015 MineWhat,Inc
 *
 * Credits: This extension is created using Extensionizr , github.com/uzairfarooq/arrive
 */

var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);

			var url = window.location.href;
			if (url.indexOf("app/kibana") >= 0 || url.indexOf("#/discover") >= 0 || url.indexOf(":5601") >= 0) {

				var options = {
					fireOnAttributesModification : true, // Defaults to false. Setting it to true would make arrive event fire on existing elements which start to satisfy selector after some modification in DOM attributes (an arrive event won't fire twice for a single element even if the option is true). If false, it'd only fire for newly created elements.
					onceOnly : false, // Defaults to false. Setting it to true would ensure that registered callbacks fire only once. No need to unbind the event if the attribute is set to true, it'll automatically unbind after firing once.
					existing : true // Defaults to false. Setting it to true would ensure that the registered callback is fired for the elements that already exists in the DOM and match the selector. If options.onceOnly is set, the callback is only called once with the first element matching the selector.
				};

				document.arrive(".button-group", options, function () {
					var alreadyExists = document.getElementById("elastic-csv-exporter");
					if (!alreadyExists)
						injectCSVExportButton();
				});

				browser.runtime.sendMessage({
					"msg" : "badge",
					data : true
				}, function () {});

			} else {
				//We are in some other page. Just exit.
				browser.runtime.sendMessage({
					"msg" : "badge",
					data : false
				}, function () {});
				return;
			}
		}
	}, 10);

function setAttributes(el, attrs) {
	for (var key in attrs) {
		el.setAttribute(key, attrs[key]);
	}
}

function parseTable() {
	var csv = "";
	var tbls = document.getElementsByTagName("table");
	for (var i = 0; i < tbls.length; i++) {
		var tbl = tbls.item(i);
		var h = tbl.innerHTML + "";

		//Replace comma with colon
		h = h.replace(/,/g, ";");

		//Remove multiple-whitespaces with one
		h = h.replace(/\s+/g, ' ');

		//Convert all tag word characters to lower case
		h = h.replace(/<\/*\w+/g, function (s) {
				return s.toLowerCase();
			});

		//special cases
		h = h.replace(/<tr><\/tr>/g, "");

		//Convert the table tags to commas and white spaces
		h = h.replace(/<\/tr>/g, "\n");
		h = h.replace(/<\/td>/g, ",");
		h = h.replace(/<\/th>/g, ",");
		h = h.replace(/( )?<.+?>( )?/g, "");

		h = h.replace(/,\n/g, "\n");
		h = h.replace(/\n,/g, "\n");

		h = h.replace(/^\s+/g, "");
		h = h.replace(/^,/g, '');
		csv += h;
	}
	return csv;
}

function parseAndCopyToClipBoard() {
	var csv = parseTable();
	browser.runtime.sendMessage({
		"msg" : "store-csv",
		data : csv
	}, function (response) {
		console.log("CSV Export:", response.status);
	});
}

function parseAndSave() {
	var csv = parseTable();
	textToDownload('kibana-export.csv', csv);
}

function textToDownload(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function createElement(type, attributes, innerHTML) {
	var elem = document.createElement(type);

	if (attributes)
		setAttributes(elem, attributes);

	if (innerHTML)
		elem.innerHTML = innerHTML;

	return elem;
}

function createCSVButton() {
	var csvInnerHTML = '<button title="Export to CSV" aria-haspopup="true" aria-expanded="false"  aria-label="Export CSV"> <p style="margin: 0;font-size: 12px;font-weight: 100;">CSV</p> </button>';

	var csvInnerHTML = '<div class="kuiLocalMenuItem" ng-repeat="menuItem in kbnTopNav.menuItems" aria-label="Export CSV" aria-haspopup="true" aria-expanded="false" ng-class="{\'kuiLocalMenuItem-isSelected\': kbnTopNav.isCurrent(menuItem.key), \'kuiLocalMenuItem-isDisabled\': menuItem.disableButton()}" ng-click="kbnTopNav.handleClick(menuItem)" ng-bind="menuItem.label" tooltip="" tooltip-placement="bottom" tooltip-popup-delay="400" tooltip-append-to-body="1" data-test-subj="discoverCSVButton">CSV</div>';

	var csvElemAttributes = {
		"tooltip" : "Export CSV",
		"tooltip-placement" : "bottom",
		"tooltip-popup-delay" : "400",
		"tooltip-append-to-body" : "1",
		"text" : "Export CSV",
		"placement" : "bottom",
		"append-to-body" : "1",
		"class" : "ng-scope",
		"id" : "elastic-csv-exporter"
	};
	var csvButton = createElement('span', csvElemAttributes, csvInnerHTML);
	csvButton.onclick = function () {
		injectMessageSlider();
	};
	return csvButton;
}

function createMessageSlider() {
	var wrapperDiv = createElement('div', {
			"style" : "padding:10px 5px; background-color:#3caed2; width:100% !important;",
			"id" : "csv-message-wrapper"
		});
	var messageBox = createElement('div', {
			"style" : "float:right; margin-top:5px; line-height:1.5em; font-size: 12px;",
			"id" : "csv-message-box"
		});
	wrapperDiv.appendChild(messageBox);

	var successText = "CSV Exporter: This will export only the visible query results.";
	var failureText = "Oops, CSV export failed.";
	messageBox.appendChild(createElement('span', null, successText));

	var copyToSaveHTML = '<button title="Download" aria-expanded="true"  aria-label="Download" style="border: 1px solid #fff;margin: 4px; padding: 1px;" onmouseover="this.style.color=\'#e8488b\';" onmouseout="this.style.color=\'#2d2d2d\';"><p style="margin: 0;font-size: 12px;font-weight:100;">Download</p></button>';
	var copyToSave = createElement('span', {
			"title" : "Download"
		}, copyToSaveHTML);
	copyToSave.onclick = function () {
		parseAndSave();
	};
	messageBox.appendChild(copyToSave);

	var copyToClipboardHTML = '<button title="Copy" aria-expanded="true"  aria-label="Copy" style="border: 1px solid #fff;margin: 4px; padding: 1px;" onmouseover="this.style.color=\'#e8488b\';" onmouseout="this.style.color=\'#2d2d2d\';"><p style="margin: 0;font-size: 12px;font-weight:100;">Copy</p></button>';
	var copyToClipboard = createElement('span', {
			"title" : "Copy"
		}, copyToClipboardHTML);
	copyToClipboard.onclick = function () {
		parseAndCopyToClipBoard();
	};
	messageBox.appendChild(copyToClipboard);

	var CloseHTML = '<button aria-expanded="true" aria-label="Close export slider" style="border: 1px solid #fff;margin: 4px; padding: 1px;" onmouseover="this.style.color=\'#e8488b\';" onmouseout="this.style.color=\'#2d2d2d\';"><p style="margin: 0;font-size: 12px;font-weight:100; padding: 0px 4px 0px 4px;">X</p></button>';
	var close = createElement('span', {
			"title" : "Close export slider"
		}, CloseHTML);
	close.onclick = function () {
		closeMessageSlider();
	};
	messageBox.appendChild(close);

	return wrapperDiv;
}

function closeMessageSlider() {
	var nav = getMessageSliderElement();
	var wrapperDiv = document.getElementById("csv-message-wrapper");

	if (nav && wrapperDiv)
		nav.removeChild(wrapperDiv);
}

function injectMessageSlider() {
	closeMessageSlider();

	var div = createMessageSlider();
	var nav = getMessageSliderElement();
	if (nav) {
		nav.appendChild(div);
	}
}

function getMessageSliderElement() {
	// only inject in the discover app
	var navbar = document.getElementsByTagName("discover-app")[0];
	var nav;

	if (!nav) {

		nav = navbar.getElementsByClassName("kuiLocalNav")[0];
	}

	return nav;
}

function injectCSVExportButton() {
	var navbar = document.getElementsByTagName("discover-app")[0];
	var buttonGroup;

	if (navbar) {
		buttonGroup = navbar.getElementsByClassName("kuiLocalMenu")[0];
	}

	if (buttonGroup) {
		var span = createCSVButton();
		buttonGroup.appendChild(span);
	}
}
