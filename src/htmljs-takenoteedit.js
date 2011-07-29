$(document).ready(function() {
	var place = $("#container").length > 0 ? $("#container")[0] : document.body;
	var space = window.location.host.split(".")[0]
	var bag = $(".bag").text() || space + "_public";
	var title = $("#title").text();
	// add edit link to notabene
	$.ajax({ url: "/spaces/" + space + "/members",
		success: function(r) {
			if(r) {
				if(bag == space + "_public") {
					$("<a id='editLink' />").attr("href", "/takenote#!/quickedit/tiddler/" + title).
						text("edit note").prependTo(place);
				}
			}
		}
	});
});
