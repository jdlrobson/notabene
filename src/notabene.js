/***
|''Name''|notabene|
|''Version''|0.2.6|
|''License''|BSD (http://en.wikipedia.org/wiki/BSD_licenses)|
***/
var APP_PATH = "/takenote";
var RESERVED_TITLES = ["takenote", "dashboard", "chrjs-store.js", "chrjs.js", "manifest.mf", "require.js",
	"notabene.css", "jquery.min.js", "jquery-ui.min.js", "jquery-json.min.js"];

// some helper functions
var notabene = {
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
	},
	getRecentChanges: function(bag) {
		var recentLocalStorageId = "takenote-recent-" + bag;
		var recent = localStorage.getItem(recentLocalStorageId);
		recent = recent ? $.parseJSON(recent) : [];
		return recent;
	},
	addRecentChange: function(bag, title) {
		var recent = notabene.getRecentChanges(bag);
		var newrecent = [];
		for(var i = 0; i < recent.length; i++) {
			if(recent[i] !== title) {
				newrecent.push(recent[i]);
			}
		}
		newrecent.push(title);
		newrecent = newrecent.length > 5 ?
			newrecent.slice(newrecent.length - 5) : newrecent;
		localStorage.setItem("takenote-recent-" + bag, $.toJSON(newrecent));
	}
};

function autoResize(el, options) {
	options = options || {};
	var resize = function(ev) {
		el = ev.target;
		var div = $('<div />').addClass($(el).attr("class")).hide().
			css({ "word-wrap": "break-word" }).insertBefore($(el)[0]);
		var value = $(el).val() || "";
		var lines = value.split("\n");
		for(var i = 0; i < lines.length; i++) {
			$("<span />").text(lines[i]).appendTo(div);
			$("<br />").appendTo(div);
		}
		var h = $(div).height();
		if(options.minHeight && h < options.minHeight) {
			h = options.minHeight;
		}
		if(options.buffer) {
			h += options.buffer;
		}
		$(ev.target).height(h);
		$(div).remove();
	};
	$(el).focus(resize).keyup(resize).blur(resize);
	$(el).focus();
}

function notes(container, options) {
	backstage();

	// configure notabene
	options = options || {};
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
		var tags = tiddler.tags || [];
		if(tags.length > 0) {
			var tagArea = $("<li />").appendTo(list);
			$("<span />").text("tags : ").appendTo(tagArea);
			for(var i = 0; i < tags.length; i++) {
				$("<span />").text(tags[i]).appendTo(tagArea);
				if(i < tags.length - 1) {
					$("<span />").text(", ").appendTo(tagArea);
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
			$(".note_title").blur().attr("disabled", true);
		}
		$(document).ready(function() {
			autoResize($("textarea.note_title")[0], { buffer: 0 });
			autoResize($(".note_text")[0], { minHeight: 250 });
		});
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
		note.tags = [];
		note.fields.created = new Date();
		loadNote();
	}

	// prints a message to the user. This could be an error or a notification.
	function printMessage(html, className, fadeout) {
		var area = $(".messageArea", container);
		area = area.length > 0 ? area : $("<div class='messageArea' />").appendTo(container);
		area.attr("class", "messageArea displayed").html("<div>" + html + "</div>");
		$(".messageArea div").stop(false, false).show();
		if(fadeout) {
			$(".messageArea div").css({ opacity: 1 }).fadeOut(3000);
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
		store.get(note, function(tid, msg, xhr) {
			var is404 = xhr ? xhr.status === 404 : false;
			if(tid) {
				note = tid;
			} else if(!is404) {
				resetNote();
			}
			if(!localStorage.getItem(bagname + "/" + note.title)) {
				if(is404 || tid) {
					note.fields._title_validated = "yes";
				}
			}
			if(is404 || tid) {
				note.fields._title_set = "yes";
			}
			$(container).addClass("ready");
			loadNote();
		});
	}

	// this initialises notabene, loading either the requested note, the last worked on note or a new note
	function init() {
		var syncButton = $(".syncButton");
		syncButton = syncButton.length > 0 ? syncButton :
			$("<div class='syncButton' />").prependTo(container);
		syncStatus();
		syncButton.click(function(ev) {
			var error, synced = 0, invalid = [];
			var dirty = store().dirty();

			printMessage("Syncing to server");
			var giveFeedback = function(tid) {
				if(tid) {
					notabene.addRecentChange(bag.name, tid.title);
				}
				if(synced === 0) {
					if(dirty.length > 0) {
						printMessage("Finish your note '" + note.title + "' before syncing.", "warning");
					} else {
						printMessage("Nothing to sync.", "warning");
					}
				} else {
					if(invalid.length > 0) {
						printMessage("Sync failed. Please rename some of your notes.", "error");
					} else if(tid && !error) {
						printMessage("Sync completed.", "", true);
					} else {
						error = true;
						printMessage("Unable to fully sync at current time.", "warning");
					}
				}
				syncStatus();
			};
			dirty.each(function(tid) {
				if(tid.title !== note.title) {
					synced += 1;
					validateNote(tid, function(newtid, isValid) {
						if(isValid) {
							store.save(newtid, giveFeedback);
						} else {
							invalid.push(newtid);
							giveFeedback(false);
						}
					});
				} else {
					giveFeedback(false);
				}
			});
		});
		var currentUrl = decodeURIComponent(window.location.hash);
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
	function validateNote(tiddler, callback) {
		var tid = new tiddlyweb.Tiddler(tiddler.title, bag);
		if(RESERVED_TITLES.indexOf(tiddler.title) > -1) {
			callback(tiddler, false, true);
		} else if(tiddler.fields._title_validated) {
			callback(tiddler, true);
		} else {
			tid.get(function() {
				callback(tiddler, false);
			}, function(xhr) {
				if(xhr.status == 404) {
					tiddler.fields._title_validated = "yes";
					callback(tiddler, true);
				} else {
					callback(tiddler, null);
				}
			});
		}
	}

	var renaming;
	function validateCurrentNoteTitle(title, callback) {
		callback = callback || function() {};
		var fixTitle = function() {
			if(renaming) {
				printMessage("Note title set.", "", true);
				renaming = false;
			}
			$(".note_title").attr("disabled", true);
		};

		validateNote(note, function(tiddler, valid, reserved) {
			//note = tiddler;
			if(valid) {
				fixTitle();
			} else if(valid === false) {
				renaming = true;
				var msg = reserved ? "This name is reserved and cannot be used. Please provide another."
					: "A note with this name already exists. Please provide another name."
				printMessage(msg, "error");
			}
			callback(valid);
		});
	}

	// on a blur event fix the title.
	$(".note_title").blur(function(ev){
		var val = $(ev.target).val();
		var trimmed = $.trim(val);
		if(trimmed.length > 0) {
			note.fields._title_set = "yes";
			renameNote(trimmed);
			storeNote();
		} else {
			delete note.fields._title_set;
			renameNote(getTitle());
		}
	}).keydown(function(ev) {
		if(ev.keyCode === 13) {
			ev.preventDefault();
		}
	});

	function addTagToCurrentNote(tag) {
		var tags = note.tags || [];
		tag = tag.toLowerCase();
		if(tags.indexOf(tag) === -1) {
			tags.push(tag);
		}
		note.tags = tags;
		printMetaData(note);
	}
	// every key press triggers a 'local' save
	var tag = [];
	var tagHandler = function(key) {
		if(key === 8) {
			tag.pop();
		} else if(key === 32 || key === 13) { // space or new line terminates tag
			if(tag.length > 1) {
				addTagToCurrentNote(tag.slice(1).join(""));
			}
			tag = [];
		} else if(key === 35) { // hash symbol
			if(tag.length > 1) {
				addTagToCurrentNote(tag.slice(1).join(""));
				tag = ["#"];
			} else {
				tag = ["#"];
			}
		} else if(tag.length > 0) {
			tag.push(String.fromCharCode(key));
		}
	};

	$(".note_text").keyup(function(ev) {
		note.text = $(ev.target).val();
		if(ev.keyCode === 8) {
			tagHandler(ev.keyCode);
		}
		storeNote();
	}).keypress(function(ev) {
		tagHandler(ev.keyCode);
	}).blur(function(ev) {
		if(tag.length > 0) {
			addTagToCurrentNote(tag.slice(1).join(""));
		}
		tag = [];
	}).click(function(ev) {
		tag = [];
	}).focus(function(ev) {
		tag = [];
	});

	function resetNote() {
		$("#note").removeClass("active");
		$(".note_title, .note_text").val("").attr("disabled", false);
		$(".note_title").focus();

		// reset url
		window.location.hash = "";
		newNote();
		syncStatus();
	}

	// on clicking the "clear" button provide a blank note
	$("#newnote").click(function(ev) {
		printMessage("Saving note...");

		validateCurrentNoteTitle(note.title, function(valid) {
			if(valid) {
				store.save(note, function(tid, options) {
					if(tid) {
						notabene.addRecentChange(bag.name, note.title);
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
	$("#cancelnote").click(function(ev) {
		var ok = confirm("Cancel this note?");
		if(ok) {
			store.remove(note.title);
			resetNote();
		}
	});
	init();
	return {
		init: init,
		tagHandler: tagHandler,
		printMessage: printMessage,
		newNote: newNote,
		loadNote: loadNote,
		store: store,
		printMetaData: printMetaData,
		validateCurrentNoteTitle: validateCurrentNoteTitle,
		getNote: function() {
			return note;
		},
		tempTitle: tempTitle,
		loadServerNote: loadServerNote
	};
}

function backstage() {
	var internet, _checking, initialised;
	function checkUser(status) {
		$.ajax({ url: "/spaces/jon/members", dataType: "json",
			success: function(members) {
				$('<li class="status" />').text("user: " + status.username).appendTo("#backstage");
			}
		});
	}
	function checkConnection() {
		if(_checking) {
			return;
		} else {
			_checking = true;
			$.ajax({ cache: false, url: "/status",
				success: function(status) {
					internet = true;
					_checking = false;
					$("body").addClass("online");
					if(!initialised) {
						checkUser(status);
						initialised = true;
					}
				},
				error: function() {
					internet = false;
					_checking = false;
					$("body").removeClass("online");
				}
			});
		}
	}
	checkConnection();
	window.setInterval(checkConnection, 10000);
}

function dashboard(container, options) {
	backstage();

	var list = $("#recentnotes");

	if(list.length > 0) {
		var recent = notabene.getRecentChanges(options.bag);
		function printRecentItems(recent) {
			if(recent.length === 0) {
				$("<li />").text("No recently created notes.").appendTo(list)[0];
			}
			for(var i = 0; i < recent.length; i++) {
				var li = $("<li />").appendTo(list)[0];
				var name = recent[i];
				$("<a />").attr("href",
					"/bags/" + options.bag + "/tiddlers/" + encodeURIComponent(name)).
					text(name).appendTo(li);
			}
		}
		printRecentItems(recent.sort());
	}

	var throbspeed = 500;
	var throb = window.setInterval(function() {
		var searching = $(".searching");
		if(searching.length > 0) {
			var opacity = searching.css("opacity");
			opacity = opacity ? parseFloat(opacity, 10) : 1;
			if(opacity > 0.7) {
				searching.animate({ opacity: 0.6 }, throbspeed)
			} else {
				searching.animate({ opacity: 1 }, throbspeed)
			}
		}
	}, throbspeed);

	var terms = {}, all_note_titles = [];
	// preload titles
	$.ajax({
		dataType: "text",
		url: "/bags/" + options.bag + "/tiddlers",
		success: function(r) {
			all_note_titles = r.split("\n");
		}
	});

	function matchNotes(term, exclude) {
		term = term.toLowerCase();
		var results = [];
		for(var i = 0; i < all_note_titles.length; i++) {
			var title = all_note_titles[i];
			if(title.toLowerCase().indexOf(term) > -1 && exclude.indexOf(title) === -1) {
				results.push({ value: title, label: title, bag: options.bag });
			}
		}
		return results;
	}

	// allow user to search for a tiddler
	$(".findnote").autocomplete({
		source: function(req, response) {
			var el = $(this.element);
			el.addClass("searching");
			var term = req.term;
			if(terms[term]) {
				return response(terms[term]);
			}
			response(matchNotes(term, []));
			$.ajax({
				url: "/search?q=bag:" + options.bag + " \"" + term + " \"",
				dataType: "json",
				success: function(r) {
					el.removeClass("searching").css({ opacity: 1 });
					var data = [];
					var exclude = [];
					for(var i = 0; i < r.length; i++) {
						var tiddler = r[i];
						var bag = tiddler.bag;
						var space = bag.split("_");
						var spacename = space[0];
						var spacetype = space[1];
						var type = tiddler.type;
						exclude.push(tiddler.title);
						if(!type) { // only push "tiddlers" without a type
							data.push({ value: tiddler.title, label: tiddler.title, bag: tiddler.bag })
						}
					}
					data = data.concat(matchNotes(term, exclude));
					if(data.length === 0) {
						data.push({ label: "No notes found" });
					}
					terms[term] = data;
					response(data);
				},
				error: function() {
					var data = [];
					data.concat(matchNotes(term, []));
					if(data.length === 0) {
						data.push({ label: "Unable to search at current time" });
					}
					el.removeClass("searching").css({ opacity: 1 });
					response(data);
				}
			});
		},
		select: function(event, ui) {
			if(ui.item.value && ui.item.bag) {
				window.location = "/bags/" + ui.item.bag + "/tiddlers/" + encodeURIComponent(ui.item.value);
			}
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
		$("<a />").attr("href", APP_PATH + "#!/tiddler/" + title).
			text(title).appendTo(item);
	}
	if(tiddlers.length === 0) {
		$("<li />").text("None.").appendTo(listIncomplete)[0];
	}
}
