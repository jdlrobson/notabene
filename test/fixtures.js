var no_connection_xhr = {
	status: 0
};

var xhr = {
	getResponseHeader: function() {
		return "yes";
	},
	status: 200
};

function NOP() {
}

var google = {
	bookmarkbubble: {
		Bubble: function() {
			return {
				showIfAllowed: NOP
			};
		}
	}
};

var xhr404 = {
	status: 404
};

var xhr500 = {
	status: 500
};

var ajaxRequests = [];
var internet = true;
function setConnectionStatus(status) {
	internet = status;
}

var _oldAjax = $.ajax;
$.ajax = function(options) {
	ajaxRequests.push(options);
	var handlers = {
		"/?limit=1": function(options) {

		},
		"/status": function(options) {

		},
		"/bags/slow/tiddlers/bar": function() {
			
		},
		"/bags/bar/tiddlers/bar": function() {
			
		},
		"/bags/bar/tiddlers?select=tag:!excludeLists": function(options) {

		},
		"/tiddlers?select=tag:!excludeLists&sort=-created&limit=5": function(options) {

		},
		"/bags/test_public/tiddlers/bar": function(options) {
			options.error(xhr404);
		},
		// tiddlers that live on the server and result in successful ajax
		"/bags/bag/tiddlers/bar": function(options) {
			var tid = { title: "bar", text: "The correct text",
				modified: "201001131203",
				created: "201001120803",
				fields: {},
				bag: "bag"
			};
			options.success(tid, "tests", xhr);
		},
		"/bags/x_public/tiddlers/bar": function(options) {
			var tid = { title: "bar", modified: "201001131203",
			created: "201001120803", fields: {}, text: "The correct text from bag x" }
			options.success(tid, "tests", xhr);
		},
		// tiddler that throws a 500 on all ajax requests
		"/bags/bag/tiddlers/500": function(options) {
			options.error(xhr500);
		},
		// tiddlers that can be put to the server but never got or deleted
		"/bags/bag/tiddlers/bar%20dum": function(options) {
			if(options.type == "PUT") {
				var tid = { title: "bar dum", fields: {}, text: "f" };
				return options.success("", 200, xhr);
			}
			options.error(xhr404);
		},
		"/bags/slow/tiddlers/slow": function(options) {
			window.setTimeout(function() {
				options.error(xhr404);
			}, 4000);
		},
		// tiddlers that are not on the server
		"/bags/bag/tiddlers/bar%20dum%20%2F%20test": function(options) {
			options.error(xhr404);
		},
		"/bags/test_public/tiddlers/Test": function(options) {
			options.error(xhr404);
		},
		"/bags/test_public/tiddlers/Test2": function(options) {
			options.error(xhr404);
		},
		"/bags/bag/tiddlers/takenote": function(options) {
			options.error(xhr404);
		}
	};
	if(!internet) {
		return options.error(no_connection_xhr);
	}
	if (options && handlers[options.url]) {
		handlers[options.url](options);
	} else {
		throw "failed to access " + options.url;
	}
};
