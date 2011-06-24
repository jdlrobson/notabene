var no_connection_xhr = {
	status: 0
};

var xhr = {
	getResponseHeader: function() {
		return "yes";
	},
	status: 200
};

var xhr404 = {
	status: 404
};

var internet = true;
function setConnectionStatus(status) {
	internet = status;
}

var _oldAjax = $.ajax;
$.ajax = function(options) {
	var handlers = {
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
		// tiddlers that can be put to the server but never got or deleted
		"/bags/bag/tiddlers/bar%20dum": function(options) {
			if(options.type == "PUT") {
				var tid = { title: "bar dum", fields: {}, text: "f" };
				options.success("", 200, xhr);
			}
			options.error(xhr404);
		},
		// tiddlers that are not on the server
		"/bags/test_public/tiddlers/Test": function(options) {
			options.error(xhr404);
		},
		"/bags/test_public/tiddlers/Test2": function(options) {
			options.error(xhr404);
		}
	};
	if(!internet) {
		options.error(no_connection_xhr);
	}
	if (options && handlers[options.url]) {
		handlers[options.url](options);
	} else {
		_oldAjax.apply(this, arguments);
	}
};
