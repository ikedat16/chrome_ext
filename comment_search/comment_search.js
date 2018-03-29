$(function(){

	var bg = chrome.extension.getBackgroundPage();
	var gapi = bg.gapi;

	var userid;
	var g_actReq;
	
	//=======================
	// class - Google+ API request
	//=======================	
	//-----  people.get  -----
	var PeopleGet = function(){
		this.param = {
			"userId": ""
			,"fields": "displayName"
		};
	};
	PeopleGet.prototype = {
		request : function() {
			return gapi.client.plus.people.get(this.param);
		},
		response : function(referer) {
			return function(resp) {
				if (!checkResp(resp)) return;
				var req = new ActSearch();
				req.param.query = resp.displayName;
				execApi(req, referer);

			};
		},
	};

	//----- activities.search  -----
	var ActSearch = function(){
		this.param = {
			"query": ""
			, "language": bg.getBrowserLang()
			, "maxResults": 20
			, "orderBy": "recent"
		};
	};
	ActSearch.prototype = {
		request : function() {
			return gapi.client.plus.activities.search(this.param);
		},
		response : function(referer) {
			return function(resp) {
				if (!checkResp(resp)) return;
				console.log("res activities: ", resp);
				
				if(resp["items"]) {
				
					jQuery.each(resp.items, function() {
					
						var activity = this;
						if (activity.actor.id != userid && activity.object.replies.totalItems > 0) {
							console.log("try comment search! user: " + activity.actor.displayName); 
	
							//get comment
							var req = new CommentList();
							req.param.activityId = activity.id;
							execApi(req, {"activity": activity});
						}
					});
					
				}
				
				// has next?
				if(resp["nextPageToken"]) {
					console.log("activity next exists..."); 
					// save
					referer.req.param.pageToken = resp["nextPageToken"];
					g_actReq = referer.req;
					$("#next").show("nomal");
					
				} else {
					console.log("activity end."); 
					$("#next").hide("nomal");
				}
			};
		},
	};

	//----- comments.list  -----
	var CommentList = function(){
		this.param = {
			"activityId": ""
			, "maxResults": 100
		};
	};
	CommentList.prototype = {
		request : function() {
			return gapi.client.plus.comments.list(this.param);
		},
		response : function(referer) {
			return function(resp) {
				if (!checkResp(resp)) return;
				console.log("res comments.list user: ", referer.activity.actor.displayName, resp); 
				
				outComment(resp, referer.activity);
			
				if(resp["nextPageToken"]) {
					console.log("comment next exists: ",  referer.activity.actor.displayName, " nextPageToken:", resp.nextPageToken);
					referer.req.param.pageToken = resp.nextPageToken;
					execApi(referer.req, referer);
				}
			};
		},
	};

	//=======================
	// class - create result tag
	//=======================
	var ResultTagCreator = function(){};
	ResultTagCreator.prototype = {
		tpl_act : '<div id="update-" class="rslt_block"><!-- activity --><div class="activity"><a href="" target="_blank" ><img class="prof_img" src="" alt="profile photo"></a><span class="name"><a href="" target="_blank" >name</a></span><span class="time">&nbsp;-&nbsp;       <a href="" target="_blank" title=""></a></span><div class="content"><div class="content_main"></div><div class="attachments"></div></div><!-- comment block --><div class="comment_block"></div></div></div>',

		tpl_comment : '<!-- comment  --><div id="" class="comment"><a href="" target="_blank" ><img class="prof_img" src="" alt="profile photo"></a><span class="name"><a href="" target="_blank" >name</a></span>&nbsp;-&nbsp;		   <span class="content">commnet</span><div class="comment_info"><span class="time" title="2012/01/23 22:51:47">22:51</span></div></div>',

		// ----- activity -----
		createActivity : function(activity) {

			$act = $(this.tpl_act);
			$act.attr("id", activity.id);
			$(".activity > a, .name > a", $act)
				.attr("href", activity.actor.url);
			$(".time > a", $act)
				.attr("href", activity.url)
				.attr("title", "link")
				.text(getDispTime(activity.published));
			$(".activity .prof_img", $act)
				.attr("src", activity.actor.image.url);
			$(".name > a", $act)
				.text(activity.actor.displayName);
			if (activity.verb === "share") {
				$(".content_main", $act)
					.html(activity.annotation + "<br />=== share ===<br />" + activity.object.content);
			} else {
				$(".content_main", $act)
					.html(activity.object.content);
			}
			
			// ----- attachments -----
			var $atch = $(".attachments", $act);
			if (activity.object.attachments) {
				this.setAttachments($atch, activity.object.attachments);
			} else {
				$atch.empty();
			}
			
			return $act;
		},

		// ----- attachments -----
		setAttachments : function($atch, attachments) {
		
			$atch.text("--- attachments ---").append("<br>");
				
			jQuery.each(attachments, function() {

				if (this.objectType === "photo") {
					$("<a>")
						.attr("href", this.url)
						.attr("title", "link")
						.attr("target", "_blank")
					.append(
					$("<img>")
						.attr("src", this.image.url)
						.attr("alt", "link")
					).appendTo($atch);
				
				} else if(this.objectType === "video") {
				
					$("<a>")
						.attr("href", this.url)
						.attr("title", "link")
						.attr("target", "_blank")
					.append(
					$("<img>")
						.attr("src", this.image.url)
						.attr("alt", this.displayName)
					).appendTo($atch);
				
				} else {
					$("<a>")
						.attr("href", this.url)
						.attr("title", "link")
						.attr("target", "_blank")
						.text(this.displayName)
					.appendTo($atch);
					$atch.append("<br>");
				}
			
			
			});
			return $atch;
		},

		// ----- comment -----
		createComment : function(comment) {
			var $cmt = $(this.tpl_comment);
			$("a", $cmt)
				.attr("href", comment.actor.url);
			$(".prof_img", $cmt)
				.attr("src", comment.actor.image.url);
			$(".name > a", $cmt)
				.text(comment.actor.displayName);
			$(".time", $cmt)
				.attr("title", comment.published)
				.text(getDispTime(comment.published));
			$(".content", $cmt)
				.html(comment.object.content);

			return $cmt;
		},
	};
	var tagCreator = new ResultTagCreator();


	//=======================
	// out comment
	//=======================
	function outComment(comments, activity) {
	
		// comment list loop
		jQuery.each(comments.items, function() {
		
			if (this.actor.id != userid) {
				return;
			}
			
			console.log("*** FIND! ***: " + this.object.content); 

			// ----- activity -----
			var $act = $("#" + activity.id);
			if (!$act.length) {
				$act = tagCreator.createActivity(activity);
			}
			
			// ----- comment -----
			var $comment = tagCreator.createComment(this);
			
			
			$(".comment_block", $act).append($comment);
			$act.appendTo("#result");
	
		});

	}

	//=======================
	// response check
	//=======================
	function checkResp(resp) {
		if (resp.error) {
			console.error(resp);
			alert(resp.code + ":" + resp.message);
			return false;
		}
		return true;
	}
	
	//=======================
	// execute API
	//=======================
	function execApi(req, referer) {
		console.log('-> request param.', req.param);
		referer.req = req;
		req.request().execute(req.response(referer));
	}
	
	//=======================
	// get time for display
	//=======================
	function getDispTime(time) {
//		return time.replace(/T/, " ").replace(/\..*$/, "");
		var dt = new Date(time);
		return dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate() + " " + dt.toLocaleTimeString();
	}


	//=======================
	// event
	//=======================
	$("#search").click(function () {
		console.log('click! search.');
		execSearchComment();
	
	});
	$("#next").click(function () {
		console.log('click! next search.');

		if (!g_actReq) {
			console.log('bug?');
			return;	
		}
		$("#next").hide("nomal");
		execApi(g_actReq, {});

	
	});

	//=======================
	// chrome addListener
	//=======================
	chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
		console.log(sender.tab ?
			"from a content script:" + sender.tab.url :
			"from the extension");
		$("#user_id").val(request.user_id);	
		
		execSearchComment();
		sendResponse({}); // snub them.
		}
	);

	//=======================
	// comment search main
	//=======================
	function execSearchComment() {
		userid = $("#user_id").val();
		if (!userid) {
			alert("Please input userid. ");
			return;
		}
		$("#result").empty();
		console.log('@@@@ execute. : ' + userid);
		
		var req = new PeopleGet();
		req.param.userId = userid;
		execApi(req, {});
	}

});
