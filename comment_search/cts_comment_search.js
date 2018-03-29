$(document).ready(function() {

	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
		var ret = {};
		switch (request.cmd) {
		case 'highlite':
			$('a[oid=' + request.user_id + ']:parent').css({
				backgroundColor : request.color
			});
			break;
		case 'getId':
			ret.id = $('[oid]:first').attr('oid');
		}
		sendResponse(ret);
	});
});
