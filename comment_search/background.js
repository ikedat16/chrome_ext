// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
	// If the letter 'g' is found in the tab's URL...
	if (tab.url.indexOf('https://plus.google') > -1) {
		// ... show the page action.
		chrome.pageAction.show(tabId);
	}
};
// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

function load() {
	try {
		console.log('load.');
		gapi.client.load('plus', 'v1', function() {});
		console.log('setApiKey.');
		gapi.client.setApiKey(getApikey());
	} catch (e) {
		alert(e);
	}
}

function createTab(userId) {
	var url = chrome.extension.getURL("comment_search.html");
	chrome.tabs.create({"url":url, "selected":true}, function(tab){
		console.log('load end.');
		chrome.tabs.sendRequest(tab.id, {user_id: userId}, function(response) {
			console.log("got response:" + response);
		});

	});
}

function highlite(userId) {
	chrome.tabs.getSelected(null, function(tab) {
		console.log("tab:" + tab);
		chrome.tabs.sendRequest(tab.id, {user_id: userId, color: getUserBgColor()}, function(response) {
			console.log("got response:" + response);
		});
	});
}

function getUserBgColor() {
	var color = localStorage["user_bg_color"];
	return color ? color : "#ff7f50";
}

function getBrowserLang() {
	var language = localStorage["language"];
	return language ? language : window.navigator.language;
}

function getApikey() {
	var apikey = localStorage["apikey"];
	return apikey ? apikey : 'AIzaSyBDDDifbqHJTGvX85XdqJutpvjAtX5PBOU';
}
