function notes(bagname, host) {
	var bag = new tiddlyweb.Bag(bagname, host);
	var store =  new tiddlyweb.Store();
	var note, tempTitle;
	function newNote() {
		tempTitle = "untitled note " + Math.random();
		note = new tiddlyweb.Tiddler(tempTitle);
		note.created = new Date();
	}
	newNote();

	function storeNote() {
		note.modified = new Date();
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
		}, 4000);
		window.setTimeout(function() {
			$("#note").removeClass("active");
			$(".note_title").focus();
		}, 4000);
		store.save(function() {
			// do nothing for time being
		});
		newNote();
	});

	//tie delete button to delete event
	$("#deletenote").click(function(ev) {
		$("#note").addClass("deleting");
		setTimeout(function() {
			$("#note").removeClass("deleting");
			$(".note_title, .note_text").val("").attr("disabled", false);
		}, 2000);
		if(note) {
			store.remove({ tiddler: note, delete: true }); // TODO: ideally I would like to call store.removeTiddler(note) and not worry about syncing
		}
	});
}
