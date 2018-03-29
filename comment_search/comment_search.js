$(function() {

	var bg = chrome.extension.getBackgroundPage();
	var gapi = bg.gapi;

	/**
	 * execute API.
	 */
	function execApi(req) {
		req.getReq().then(req.response.bind(req), function(reason) {
			console.error('Error: ', reason.result.error);
			alert('Error: ' + reason.result.error.message);
		});
	}

	/**
	 * comment search main.
	 */
	function execSearchComment() {
		var userid = $("#user_id").val();
		if (!userid) {
			alert("Please input userid. ");
			return;
		}
		$("#result").empty();
		console.log('@@@@ execute. : ' + userid);

		var req = new PeopleGet({
			userId : userid
		});
		execApi(req);
	}

	/**
	 * class - peopleget
	 */
	var PeopleGet = (function() {
		var _params = {
			"userId" : "",
			"fields" : "displayName",
		};

		var cls = function(params) {
			this.param = $.extend(true, {}, _params, params);
		};

		cls.prototype.getReq = function() {
			return gapi.client.plus.people.get(this.param);
		};
		cls.prototype.response = function(resp) {
			console.log(this.param.userId + '->' +  resp.result.displayName);
			var req = new ActSearch({
				query : resp.result.displayName
			});
			execApi(req);
		};

		return cls;
	})();

	/**
	 * class - ActSearch
	 */
	var ActSearch = (function() {
		var _params = {
			"query" : "",
			"language" : bg.getBrowserLang(),
			"maxResults" : 20,
			"orderBy" : "recent",
			"fields" : "items,nextPageToken",
		};

		var cls = function(params) {
			this.param = $.extend(true, {}, _params, params);
		};

		cls.prototype.getReq = function() {
			return gapi.client.plus.activities.search(this.param);
		};
		cls.prototype.response = function(resp) {
			console.log("res activities: ", resp.result.items.length);
			var result = resp.result;
			var targetId = $("#user_id").val();

			result.items && $.each(result.items, function(i, activity) {
				if (activity.actor.id === targetId || !activity.object.replies.totalItems) return;

				//get comment
				console.log("try comment search! user: " + activity.actor.displayName);
				var req = new CommentList({
					activityId : activity.id
				}, activity);
				execApi(req);
			});

			// has next?
			if (result.nextPageToken && result.items.length > 0) {
				console.log("activity next exists...");
				// save
				this.param.pageToken = result.nextPageToken;
				// g_actReq = this;
				$("#next").data("actReq", this).show("nomal");
			} else {
				console.log("activity end.");
				alert('no more results.');
				$("#next").hide("nomal");
			}
		};

		return cls;
	})();

	/**
	 * class - CommentList
	 */
	var CommentList = (function() {
		var _params = {
			"activityId" : "",
			"maxResults" : 100,
		};

		var cls = function(params, activity) {
			this.param = $.extend(true, {}, _params, params);
			this.activity = activity;
		};

		cls.prototype.getReq = function() {
			return gapi.client.plus.comments.list(this.param);
		};
		cls.prototype.response = function(resp) {
			console.log("res comments.list user: ", this.activity.actor.displayName);
			var result = resp.result;

			tagCreator.outComment(result, this.activity);

			if (result.nextPageToken) {
				console.log("comment next exists: ", this.activity.actor.displayName, " nextPageToken:", result.nextPageToken);
				this.param.pageToken = result.nextPageToken;
				execApi(this);
			}
		};

		return cls;
	})();

	/**
	 * create result tag.
	 */
	var tagCreator = (function() {
		var tpl_act = '<div id="update-" class="rslt_block"><!-- activity --><div class="activity"><a href="" target="_blank" ><img class="prof_img" src="" alt="profile photo"></a><span class="name"><a href="" target="_blank" >name</a></span><span class="time">&nbsp;-&nbsp;       <a href="" target="_blank" title=""></a></span><div class="content"><div class="content_main"></div><div class="attachments"></div></div><!-- comment block --><div class="comment_block"></div></div></div>';
		var tpl_comment = '<!-- comment  --><div id="" class="comment"><a href="" target="_blank" ><img class="prof_img" src="" alt="profile photo"></a><span class="name"><a href="" target="_blank" >name</a></span>&nbsp;-&nbsp;		   <span class="content">commnet</span><div class="comment_info"><span class="time" title="2012/01/23 22:51:47">22:51</span></div></div>';

		var obj = {};
		obj.outComment = function(comments, activity) {
			var userid = $("#user_id").val();
	
			// comment list loop
			$.each(comments.items, function(i, comment) {
				if (comment.actor.id != userid) return;
				// console.log("*** FIND! ***: " + comment.object.content);
				console.log("*** comment found! ***");
	
				// ----- activity -----
				var $act = $("#" + activity.id);
				if (!$act.get(0)) {
					$act = createActivity(activity);
				}
	
				// ----- comment -----
				var $comment = createComment(comment);
	
				$(".comment_block", $act).append($comment);
				$act.appendTo("#result");
			});
		};
		/**  create activity */
		function createActivity(activity) {
			var $act = $(tpl_act);
			$act.attr("id", activity.id);
			$(".activity > a, .name > a", $act).attr("href", activity.actor.url);
			$(".time > a", $act).attr("href", activity.url).attr("title", "link").text(getDispTime(activity.published));
			$(".activity .prof_img", $act).attr("src", activity.actor.image.url);
			$(".name > a", $act).text(activity.actor.displayName);
			$(".content_main", $act).html(
				(activity.verb === "share" ? activity.annotation + "<br />=== share ===<br />" : '')
				+ activity.object.content);

			// ----- attachments -----
			var $atch = $(".attachments", $act);
			if (activity.object.attachments) {
				setAttachments($atch, activity.object.attachments);
			} else {
				$atch.empty();
			}

			return $act;
		}

		/**  create attachments */
		function setAttachments($atch, attachments) {
			$atch.text("--- attachments ---").append("<br>");
			$.each(attachments, function(i, item) {
				if (item.objectType === "photo") {
					$("<a>").attr("href", item.url).attr("title", "link").attr("target", "_blank").append($("<img>").attr("src", item.image.url).attr("alt", "link")).appendTo($atch);
				} else if (item.objectType === "video") {
					$("<a>").attr("href", item.url).attr("title", "link").attr("target", "_blank").append($("<img>").attr("src", item.image.url).attr("alt", item.displayName)).appendTo($atch);
				} else {
					$("<a>").attr("href", item.url).attr("title", "link").attr("target", "_blank").text(item.displayName).appendTo($atch);
					$atch.append("<br>");
				}
			});
			return $atch;
		}

		/**  create comment */
		function createComment(comment) {
			var $cmt = $(tpl_comment);
			$("a", $cmt).attr("href", comment.actor.url);
			$(".prof_img", $cmt).attr("src", comment.actor.image.url);
			$(".name > a", $cmt).text(comment.actor.displayName);
			$(".time", $cmt).attr("title", comment.published).text(getDispTime(comment.published));
			$(".content", $cmt).html(comment.object.content);

			return $cmt;
		};


		/**  get time for display */
		function getDispTime(time) {
			//		return time.replace(/T/, " ").replace(/\..*$/, "");
			var dt = new Date(time);
			return dt.toLocaleString();
			// return dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate() + " " + dt.toLocaleTimeString();
		}

		return obj;
	})();

	//=======================
	// chrome addListener
	//=======================
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
		$("#user_id").val(request.user_id);
		execSearchComment();
		sendResponse({});
	});
	//=======================
	// event
	//=======================
	$("#search").click(function() {
		console.log('click! search.');
		execSearchComment();

	});
	$("#next").click(function() {
		console.log('click! next search.');
		$(this).hide("nomal");
		execApi($(this).data("actReq"));
	});

});
