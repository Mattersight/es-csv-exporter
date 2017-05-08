/*
 * Elasticsearch CSV Exporter
 * v0.2
 * https://github.com/minewhat/es-csv-exporter
 * MIT licensed
 *
 * Copyright (c) 2014-2015 MineWhat,Inc
 *
 * Credits: This extension is created using Extensionizr , github.com/uzairfarooq/arrive
 */


browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
      if (request.msg == "store-csv"){
        var csvContents = request.data;
        var input = document.createElement('textarea');
        document.body.appendChild(input);
        input.value = csvContents;
        input.focus();

        //Select all content
        document.execCommand('SelectAll');
        //Copy Content
        document.execCommand("Copy", false, null);
        input.remove();

        sendResponse({status: "success"});
      }else if(request.msg == "badge"){
        badgeOnOff(request.data);
      }else{
        sendResponse({status: "Unknown Message"});
      }
    }
);


function badgeOnOff(on) {
  if (on) {
    browser.browserAction.setBadgeText({text: 'ON'});
  }
  else {
	
    browser.browserAction.setBadgeText({text: 'OFF'});
  }
}
browser.browserAction.setBadgeBackgroundColor({color: '#d57d00'});
browser.browserAction.setBadgeText({text: ''});

function toggleTab(tabs) {
	for (let tab of tabs) {
		// tab.url requires the `tabs` permission in manifest.json
		if(tab && tab.url && tab.url.indexOf("app/kibana") >= 0){
			badgeOnOff(true);
		}else{
			badgeOnOff(false);
		}
	}
}

function onError(error) {
  console.log('Error: ${error}');
}

//On tab selection change
browser.tabs.onActivated.addListener(function(tabId, selectInfo){
	var querying = browser.tabs.query({currentWindow: true, active: true});
	querying.then(toggleTab, onError);
});