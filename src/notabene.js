/***
|''Name''|notabene|
|''Version''|0.1.2|
***/
var APP_PATH = "/takenote";

// some helper functions
var notabene = {
	setUrl: function(url) {
		if(window.history && history.pushState) {
			history.pushState(null, null, url);
		} else { // history not supported use the old fashion way
			window.location = url;
		}
		return url;
	},
	defaultFields: {},
	watchPosition: function(handler) {
		if(!!navigator.geolocation) {
			navigator.geolocation.watchPosition(handler);
		}
	},
	supports_local_storage: function() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch(e) {
			return false;
		}
	}
};

function notes(container, options) {
	// configure notabene
	options = options || {};
	var path = options.pathname || window.location.pathname;
	var bagname = options.bag;
	var host = options.host;
	var bag = new tiddlyweb.Bag(bagname, host);
	var store =  new tiddlyweb.Store();

	// setup onleave event
	window.onbeforeunload = function() {
		// TODO: chrjs.store should probably provide a helper method for this situation
		if(!notabene.supports_local_storage() && store().dirty().length) {
	  	return ["There are unsynced changes. Are you sure you want to leave?\n\n",
				"Please upgrade your browser if possible to make sure you never lose a note."
				].join("");
		}
	}

	// retrieve last created note
	store.retrieveCached();
	var tiddlers = store().bag(bagname).sort(function(a, b) {
		return a.fields.modified < b.fields.modified ? 1 : -1;
	});

	var note, tempTitle;

	// print the fields associated with the current note
	function printMetaData(tiddler) {
		// print meta information
		var fieldInfo = {
			created: { label: "created on" },
			modified: { label: "last modified on" }
		};
		$("#notemeta").empty();
		var container = $('<div class="paddedbox" />').appendTo("#notemeta")[0];
		var list = $("<ul />").appendTo(container)[0];
		for(var fieldname in tiddler.fields) {
			if(fieldname.indexOf("_") !== 0) {
				var val = tiddler.fields[fieldname];
				if(val) {
					var label = fieldInfo[fieldname] ? fieldInfo[fieldname].label : fieldname;
					$("<li />").text(label + ": " + val).appendTo(list);
				}
			}
		}
	}

	// load the current note into the display
	function loadNote() {
		$(".note_text").val(note.text);
		if(note.title != tempTitle && note.fields._title_set) {
			$(".note_title").val(note.title);
		}
		if(note.fields._title_validated) {
			$(".note_title").blur();
		}

		printMetaData(note);

		notabene.watchPosition(function(data) {
			// if note has existing geo data exit to prevent overwriting
			if(note.fields['geo.lat'] && note.fields['geo.long']) {
				return;
			}
			if(data) {
				var coords = data.coords;
				note.fields['geo.lat'] = String(coords.latitude);
				note.fields['geo.long'] = String(coords.longitude);
			}
		});
	}

	function getTitle() {
		return "untitled note " + Math.random();
	}

	// creates a new note with a randomly generated title and loads it into the ui
	function newNote() {
		tempTitle = getTitle();
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

	// tell the user what the current state of the store is
	function syncStatus() {
		var area = $(".syncButton");
		var unsynced = store().bag(bagname).dirty();
		$(area).text(unsynced.length);
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
			// the note title is validated and provided by user in this situation regardless
			note.fields._title_validated = "yes";
			note.fields._title_set = "yes";
			loadNote();
			$(container).addClass("ready");
		});
	}

	// this initialises notabene, loading either the requested note, the last worked on note or a new note
	function init() {
		var syncButton = $(".syncButton");
		syncButton = syncButton.length > 0 ? syncButton :
			$("<div class='syncButton' />").prependTo(container);
		syncStatus();
		syncButton.click(function(ev) {
			var error;
			printMessage("Syncing to server");
			store.save(function(tid) {
				if(tid && !error) {
					printMessage("Sync completed.", "", true);
				} else {
					error = true;
					printMessage("Unable to fully sync at current time.", "warning");
				}
				syncStatus();
			});
		});
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
		store.add(note);
		syncStatus();
	}

	function renameNote(newtitle) {
		var old = note.title;
		store.add(note);
		if(newtitle !== old) {
			note.title = newtitle;
			store.remove(new tiddlyweb.Tiddler(old, bag));
		}
	}

	/* the callback is passed true if the title is unique on the server,
	false if the title already exists and null if it is not known */
	var renaming;
	function validateTitle(title, callback) {
		callback = callback || function() {};
		var tid = new tiddlyweb.Tiddler(title, bag);
		note.fields._title_set = "yes";
		renameNote(title);
		storeNote();

		var fixTitle = function() {
			if(renaming) {
				printMessage("Note title set.", "", true);
				renaming = false;
			}
			$(".note_title").attr("disabled", true);
			note.fields._title_validated = "yes";
			callback(true);
		};

		if(note.fields._title_validated) {
			fixTitle();
		} else {
			tid.get(function() {
				renaming = true;
				printMessage("A note with this name already exists. Please provide another name.",
					"error");
				callback(false);
			}, function(xhr) {
				if(xhr.status == 404) {
					fixTitle();
				} else {
					callback(null);
				}
			});
		}
	}

	// on a blur event fix the title.
	$(".note_title").blur(function(ev){
		var val = $(ev.target).val();
		if($.trim(val).length > 0) {
			validateTitle(val);
		} else {
			delete note.fields._title_set;
			renameNote(getTitle());
		}
	});

	// every key press triggers a 'local' save
	$(".note_text").keyup(function(ev) {
		note.text = $(ev.target).val();
		storeNote();
	});

	function resetNote() {
		$("#note").removeClass("active");
		$(".note_title, .note_text").val("").attr("disabled", false);
		$(".note_title").focus();

		// reset url
		if(path != APP_PATH) { // only reset if we are on a special url e.g. /app/tiddler/foo
			path = notabene.setUrl(APP_PATH);
		}
		newNote();
		syncStatus();
	}

	// on clicking the "clear" button provide a blank note
	$("#newnote").click(function(ev) {
		printMessage("Saving note...");

		validateTitle(note.title, function(valid) {
			if(valid) {
				store.save(note, function(tid, options) {
					if(tid) {
						$("#note").addClass("active");
						printMessage("Saved successfully.", null, true);
						resetNote();
					} else {
						// TODO: give more useful error messages (currently options doesn't provide this)
						printMessage("Saved locally. Unable to post to web at current time.", "warning");
						resetNote();
					}
				});
			} else if(valid == null) {
				printMessage("Saved locally. Unable to post to web at current time.", "warning");
				resetNote();
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
			var _server = note.fields._title_validated ? true : false;
			store.remove({ tiddler: note, server: _server }, function(tid, msg, xhr) {
				syncStatus();
				if(xhr && xhr.status === 0) {
					printMessage("Could not delete from server at current time.", "warning", true);
					storeNote();
					resetNote();
				} else if(tid) {
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
	window.onpopstate = function(ev) {
		path = window.location.pathname;
		init();
	};
	init();
	return {
		init: init,
		printMessage: printMessage,
		newNote: newNote,
		loadNote: loadNote,
		store: store,
		printMetaData: printMetaData,
		getNote: function() {
			return note;
		},
		tempTitle: tempTitle,
		loadServerNote: loadServerNote
	};
}

function dashboard(container, options) {
	var terms = {};
	// allow user to search for a tiddler
	$(".findnote").autocomplete({
		source: function(req, response) {
			var term = req.term;
			if(terms[term]) {
				return response(terms[term]);
			}
			$.ajax({
				url: "/bags/" + options.bag + "/tiddlers?select=text:" + term,
				dataType: "json",
				success: function(r) {
					var data = [];
					for(var i = 0; i < r.length; i++) {
						var tiddler = r[i];
						var bag = tiddler.bag;
						var space = bag.split("_");
						var spacename = space[0];
						var spacetype = space[1];
						var type = tiddler.type;
						if(!type) { // only push "tiddlers" without a type
							data.push({ value: tiddler.title, label: tiddler.title, bag: tiddler.bag })
						}
					}
					terms[term] = data;
					response(data);
				}
			});
		},
		select: function(event, ui) {
			window.location = "/bags/" + ui.item.bag + "/tiddlers/" + ui.item.value;
		}
	});

	// TODO: refactor - some of this code is a repeat of that in the notes function
	var bagname = options.bag;
	var host = options.host;
	var bag = new tiddlyweb.Bag(bagname, host);
	var store =  new tiddlyweb.Store();
	store.retrieveCached();
	var tiddlers = store().bag(bagname).sort(function(a, b) {
		return a.title < b.title ? -1 : 1;
	});
	var listIncomplete = $("#incomplete")[0];
	for(var i = 0; i < tiddlers.length; i++) {
		var item = $("<li />").appendTo(listIncomplete)[0];
		var title = tiddlers[i].title;
		$("<a />").attr("href", APP_PATH + "/tiddler/" + title).
			text(title).appendTo(item);
	}
	if(tiddlers.length === 0) {
		$("<li />").text("None.").appendTo(listIncomplete)[0];
	}
}
