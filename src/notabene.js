function notes(bagname, host) {
	var bag = new tiddlyweb.Bag(bagname, host);
	var store =  new tiddlyweb.Store();
	store.retrieveCached();
	var tiddlers = store().sort(function(a, b) {
		return a.fields.modified < b.fields.modified ? 1 : -1;
	});
	var note, tempTitle;
	function newNote() {
		tempTitle = "untitled note " + Math.random();
		note = new tiddlyweb.Tiddler(tempTitle);
		note.fields = {};
		note.fields.created = new Date();
	}
	if(tiddlers[0]) {
		note = tiddlers[0];
		$(".note_title").val(note.title).blur();
		$(".note_text").val(note.text);
	} else {
		newNote();
	}

	function storeNote() {
		note.fields.modified = new Date();
		if(note.title != tempTitle) {
			store.remove(tempTitle);
		}
		store.addTiddler(note);
	}

	// on a blur event fix the title.
	$(".note_title").blur(function(ev){
		var val = $(ev.target).val();
		if($.trim(val).length > 0) {
			$(".note_title").attr("disabled", true);
			note.title = val;
			storeNote();
		}
	});

	$(".note_text").keyup(function(ev) {
		note.text = $(ev.target).val();
		storeNote();
	})
	// on clicking the "clear" button provide a blank note
	$("#newnote").click(function(ev) {
		$("#note").addClass("active");
		window.setTimeout(function() {
			$(".note_title, .note_text").val("").attr("disabled", false);
		}, 500);
		window.setTimeout(function() {
			$("#note").removeClass("active");
			$(".note_title").focus();
		}, 1000);
		store.save(function() {
			// do nothing for time being
		});
		newNote();
	});
}
