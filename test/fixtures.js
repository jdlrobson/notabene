var xhr = {
	getResponseHeader: function() {
		return "";
	}
}
var _oldAjax = $.ajax;
$.ajax = function(options) {
	var handlers = {
		"/bags/bag/tiddlers/bar": function(options) {
			var tid = { title: "bar", text: "The correct text",
				modified: "201001131203",
				created: "201001120803",
				fields: {}
			};
			options.success(tid, "tests", xhr);
		},
		"/bags/test_public/tiddlers/Test": function(options) {
			options.error();
		}
	};
	if (options && handlers[options.url]) {
		handlers[options.url](options);
	} else {
		_oldAjax.apply(this, arguments);
	}
};
