$(document).ready(function(){

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		
		$('a[oid=' + request.user_id + ']:parent').css({ backgroundColor: request.color});
			sendResponse({}); // snub them.
		}
	);
  

});
