// some helper functions
var notabene = {
	setUrl: function(url) {
		history.pushState(null, null, url);
		return url;
	}
};

function notes(container, options) {
	// configure notabene
	options = options || {};
	var path = options.pathname || window.location.pathname;
	var app_path = "/" + path.split("/")[1];
	var bagname = options.bag;
	var host = options.host;
	var bag = new tiddlyweb.Bag(bagname, host);
	var store =  new tiddlyweb.Store();

	// retrieve last created note
	store.retrieveCached();
	var tiddlers = store().sort(function(a, b) {
		return a.fields.modified < b.fields.modified ? 1 : -1;
	});
	
	var note, tempTitle;
	// load the current note into the display
	function loadNote() {
		$(".note_text").val(note.text);
		if(note.title != tempTitle) {
			$(".note_title").val(note.title);
		}
		if(note.fields._title_validated) {
			$(".note_title").blur();
		}

		// print meta information
		var fieldInfo = {
			created: { label: "created on" },
			modified: { label: "last modified on" }
		};
		$("#notemeta").empty();
		var container = $('<div class="paddedbox" />').appendTo("#notemeta")[0];
		var list = $("<ul />").appendTo(container)[0];
		for(var fieldname in note.fields) {
			if(true) {
				var val = note.fields[fieldname];
				if(val) {
					var label = fieldInfo[fieldname] ? fieldInfo[fieldname].label : fieldname;
					$("<li />").text(label + ": " + val).appendTo(list);
				}
			}
		}
	}

	// creates a new note with a randomly generated title and loads it into the ui
	function newNote() {
		tempTitle = "untitled note " + Math.random();
		note = new tiddlyweb.Tiddler(tempTitle, bag);
		note.fields = {};
		note.fields.created = new Date();
		loadNote();
	}

	// prints a message to the user. This could be an error or a notification.
	function printMessage(html, className, fadeout) {
		var area = $(".messageArea", container);
		area = area.length > 0 ? area : $("<div class='messageArea' />").appendTo(container);
		area.attr("class", "messageArea").html(html).stop(false, false).show();
		if(fadeout) {
			area.css({ opacity: 1 }).fadeOut(3000);
		}
		if(className) {
			$(area).addClass(className);
		}
	}

	// this loads the note with the given title from the active bag and loads it into the display
	function loadServerNote(title) {
		note = new tiddlyweb.Tiddler(title);
		note.fields = {};
		note.bag = new tiddlyweb.Bag(bagname, host);
		store.get(note, function(tid) {
			if(tid) {
				note = tid;
			}
			// the note title is validated in this situation regardless
			note.fields._title_validated = "yes";
			loadNote();
			$(container).addClass("ready");
		});
	}

	// this initialises notabene, loading either the requested note, the last worked on note or a new note
	function init() {
		var currentUrl = decodeURIComponent(path);
		var match = currentUrl.match(/tiddler\/([^\/]*)$/);
		if(match && match[1]) {
			loadServerNote(match[1]);
		} else {
			if(tiddlers[0]) {
				note = tiddlers[0];
				loadNote();
			} else {
				newNote();
			}
			$(container).addClass("ready");
		}
	}

	// this stores the note locally (but not on the server)
	function storeNote() {
		note.fields.modified = new Date();
		if(tempTitle && note.title != tempTitle) {
			store.remove(tempTitle);
		}
		store.add(note);
	}

	// on a blur event fix the title.
	var renaming;
	$(".note_title").blur(function(ev){
		var val = $(ev.target).val();
		if($.trim(val).length > 0) {
			var tid = new tiddlyweb.Tiddler(val, bag);

			var fixTitle = function() {
				if(renaming) {
					printMessage("Note title set.", "", true);
					renaming = false;
				}
				$(".note_title").attr("disabled", true);
				note.title = val;
				note.fields._title_validated = "yes";
				storeNote();
			};

			if(note.fields._title_validated) {
				fixTitle();
			} else {
				tid.get(function() {
					renaming = true;
					printMessage("A note with this name already exists. Please provide another name.",
						"error");
					storeNote();
				}, function() {
					fixTitle();
				});
			}
		}
	});

	// every key press triggers a 'local' save
	$(".note_text").keyup(function(ev) {
		note.text = $(ev.target).val();
		storeNote();
	});

	// on clicking the "clear" button provide a blank note
	$("#newnote").click(function(ev) {
		printMessage("Saving note...");
		var reset = function() {
			$("#note").removeClass("active");
			$(".note_title, .note_text").val("").attr("disabled", false);
			$(".note_title").focus();

			// reset url
			if(path != app_path) { // only reset if we are on a special url e.g. /app/tiddler/foo
				path = notabene.setUrl(app_path);
			}
			newNote();
		};
		store.save(function(tid, options) {
			if(tid) {
				$("#note").addClass("active");
				printMessage("Saved successfully.", null, true);
				reset();
			} else {
				// TODO: give more useful error messages (currently options doesn't provide this)
				printMessage("Error saving note. Please try again.", "error");
			}
		});
	});

	//tie delete button to delete event
	$("#deletenote").click(function(ev) {
		var ok = confirm("Delete this note?");
		if(!ok) {
			return;
		}
		printMessage("Deleting note...");
		if(note) {
			store.remove({ tiddler: note, "delete": true }, function(tid) {
				if(tid) {
					$("#note").addClass("deleting");
					printMessage("Note deleted.", null, true);
					$("#note").removeClass("deleting");
					$(".note_title, .note_text").val("").attr("disabled", false);
				} else {
					printMessage("Error deleting note. Please try again.", "error");
				}
			}); // TODO: ideally I would like to call store.removeTiddler(note) and not worry about syncing
		}
	});
	init();
	return {
		init: init,
		printMessage: printMessage,
		newNote: newNote,
		loadNote: loadNote,
		store: store,
		getNote: function() {
			return note;
		},
		tempTitle: tempTitle,
		loadServerNote: loadServerNote
	};
}
