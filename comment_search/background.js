// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
	// If the letter 'g' is found in the tab's URL...
	if (~tab.url.indexOf('https://plus.google')) {
		// ... show the page action.
		chrome.pageAction.show(tabId);
	}
};
// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

// *** called from html
function load() {
	try {
		gapi.client.setApiKey(getApikey());
		gapi.client.load('plus', 'v1').then(function() { console.log('loaded.'); });
	} catch (e) {
		alert(e);
	}
}

function createTab(userId) {
	var url = chrome.extension.getURL("comment_search.html");
	chrome.tabs.create({"url":url, "selected":true}, function(tab){
		console.log('load end.');
		setTimeout(function(){
			chrome.tabs.sendRequest(tab.id, {user_id: userId}, function(response) {
				console.log("got response:" + response);
			});
		}, 500);
	});
}

function highlite(userId) {
	chrome.tabs.getSelected(null, function(tab) {
		console.log("tab:" + tab);
		chrome.tabs.sendRequest(tab.id, {cmd: 'highlite', user_id: userId, color: getUserBgColor()}, function(response) {
			console.log("got response:" + response);
		});
	});
}

function getUserBgColor() {
	var color = localStorage["user_bg_color"];
	return color || "#ff7f50";
}

function getBrowserLang() {
	var language = localStorage["language"];
	return language || window.navigator.language;
}

function getApikey() {
	return localStorage["apikey"] || 'AIzaSyBDDDifbqHJTGvX85XdqJutpvjAtX5PBOU';
	//test
	//return localStorage["apikey"] || 'AIzaSyAZpZnquLNIfIw9MCHbei95oVDNLj42RFI';
}

