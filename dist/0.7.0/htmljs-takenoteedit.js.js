/***
!Description
Updates the html serialization in TiddlySpace to provide routes to the takenote tool
***/
$(document).ready(function() {
	var place = $("#container").length > 0 ? $("#container")[0] : document.body;
	var space = window.location.host.split(".")[0]
	var bag = $(".bag").first().text() || space + "_public";
	var title = $("#title").text();
	// add edit link to notabene
	$.ajax({ url: "/spaces/" + space + "/members",
		success: function(r) {
			var isTiddler = $(".tiddler").length > 0;
			if(r) {
				if(bag == space + "_public") {
					if(isTiddler) {
						$("<a id='editLink' />").attr("href", "/takenote#!/quickedit/tiddler/" + encodeURIComponent(title)).
							text("edit note").prependTo(place);
					} else { // when viewing a collection add link to create new note in collection
						$("<a id='editLink' />").attr("href", "/takenote").
							text("take note").prependTo(place);
					}
				} else if(bag == space + "_private") {
					if(isTiddler) {
						$("<a id='editLink' />").attr("href", "/takenote#!/quickedit/bags/" + bag + "/tiddler/" + title).
							text("edit note").prependTo(place);
					}
				}
				if($("#backstage").length === 0) {
					$(['<ul id="backstage">',
						'<li><a href="/dashboard">dashboard</a></li><li><a href="/takenote">takenote</a></li>',
						'</ul>'].join("")).prependTo(document.body);
				}
			}
		}
	});
});
