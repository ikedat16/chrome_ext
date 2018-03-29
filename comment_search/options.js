$(function(){
	var bg = chrome.extension.getBackgroundPage();

	$("#apikey").val(bg.getApikey());
	$("#language").val(bg.getBrowserLang());
	$("#color").val(bg.getUserBgColor());
	
	$('#colorpicker').farbtastic('#color');

	$("#save").click(function() {
		localStorage["apikey"] = $("#apikey").val();
		localStorage["language"] = $("#language").val();
		localStorage["user_bg_color"] = $("#color").val();
	});

});
