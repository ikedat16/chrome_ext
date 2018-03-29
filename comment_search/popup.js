var bg = chrome.extension.getBackgroundPage();

function search(){
	console.log('click! search.');
	bg.createTab(document.getElementById("user_id").value);
}

function highlite(){
	console.log("click highlight");
	bg.highlite(document.getElementById("user_id").value);
}

window.onload = function(){
    document.getElementById("search").addEventListener("click", search, false);
	
    document.getElementById("highlight").addEventListener("click", highlite, false);

	chrome.tabs.getSelected(null, function(tab) {
		var id = tab.url.match(/https:\/\/plus.google.com.*\/(\d{10,})\/.*/);
		if (id) {
			document.getElementById("user_id").value = id[1];
		}
	});
}
