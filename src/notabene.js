/*!
|''Name''|notabene|
|''Version''|0.6.9|
|''License''|BSD (http://en.wikipedia.org/wiki/BSD_licenses)|
|''Source''|https://github.com/jdlrobson/notabene/blob/master/src/notabene.js|
!*/
var APP_PATH = "/takenote";
var RESERVED_TITLES = ["takenote", "dashboard", "takenote_manifest.appcache",
	"notabene.css", "jquery-ui.min.js", "jquery-json.min.js"];

var config;

if(window.navigator.standalone) {
	$("#backstage a").click(function(ev) {
		window.location.href = $(ev.target).attr('href');
		ev.preventDefault();
		return false;
	});
}
// some helper functions
var notabene = {
	defaultFields: {},
	loadConfig: function() {
		config = localStorage.getItem("_takeNoteConfig") ? JSON.parse(localStorage.getItem("_takeNoteConfig")) : {};
		if(config.noGeoTiddlers) {
			if(new Date().getTime() - config.noGeoTiddlers > 1000*60*60*24) {
				// more than a day old so flush
				notabene.saveConfig("noGeoTiddlers", false);
			}
		}
	},
	saveConfig: function(name, value) {
		if(typeof(name) != "undefined" && typeof(value) != "undefined") {
			config[name] = value;
		}
		localStorage.setItem("_takeNoteConfig", JSON.stringify(config));
	},
	watchPosition: function(handler) {
		if(!!navigator.geolocation && !config.noGeoTiddlers) {
			navigator.geolocation.watchPosition(handler, function() {
				notabene.saveConfig("noGeoTiddlers", new Date().getTime());
			});
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
			var thisTitle = typeof(recent[i]) === "string" ? recent[i] : recent[i].title;
			if(thisTitle !== title) {
				newrecent.push(recent[i]);
			}
		}
		newrecent.push({ title: title, bag: bag });
		newrecent = newrecent.length > 5 ?
			newrecent.slice(newrecent.length - 5) : newrecent;
		localStorage.setItem("takenote-recent-" + bag, $.toJSON(newrecent));
	}
};
notabene.loadConfig();

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


function setup_store(options) {
	// configure notabene
	options = options || {};
	var bagname = options.bag;
	var host = options.host;
	var bag = new tiddlyweb.Bag(bagname, host);
	var store =  new tiddlyweb.Store();

	// retrieve last created note
	store.retrieveCached();
	return {
		store: store,
		bag: bag,
		host: host
	}
}

function notes(container, options) {
	backstage();

	// setup onleave event
	window.onbeforeunload = function() {
		// TODO: chrjs.store should probably provide a helper method for this situation
		if(!notabene.supports_local_storage() && store().dirty().length) {
	  	return ["There are unsynced changes. Are you sure you want to leave?\n\n",
				"Please upgrade your browser if possible to make sure you never lose a note."
				].join("");
		}
	}
	var instance = setup_store(options);
	var store = instance.store;
	var bag = instance.bag;
	var host = instance.host;
	var tiddlers = store().sort(function(a, b) {
		return a.fields._modified < b.fields._modified ? 1 : -1;
	});
	var note, tempTitle;

	// print the fields associated with the current note
	function printMetaData(tiddler) {
		// print meta information
		var fieldInfo = {
			_created: { label: "created on" },
			_modified: { label: "last modified on" }
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
				$('<a class="removeTag">remove</a>').data("tag", tags[i]).click(function(ev) {
					var tag = $(ev.target).data("tag");
					removeTag(tag);
					storeNote();
					ev.preventDefault();
				}).appendTo(tagArea);
			}
		}
	}

	// load the current note into the display
	function loadNote() {
		$(".note_title").val("");
		$(".note_text").val(note.text);
		if(note.title != tempTitle && note.fields._title_set) {
			$(".note_title").val(note.title).focus();
		}
		if(note.fields._title_validated) {
			$(".note_title").blur().attr("disabled", true);
			$(document.body).addClass("validatedNote");
		} else {
			$(document.body).removeClass("validatedNote");
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
		note.tags = [];
		note.fields._created = new Date();
		loadNote();
	}

	// prints a message to the user. This could be an error or a notification.
	function printMessage(html, className, fadeout) {
		var area = $(".messageArea", container);
		area = area.length > 0 ? area : $("<div class='messageArea' />").appendTo(container);
		area.attr("class", "messageArea displayed").html("<div>" + html + "</div>");
		$(".messageArea div").stop(false, false).show();
		if(fadeout) {
			$(".messageArea div").css({ opacity: 1 }).fadeOut(5000);
		}
		if(className) {
			$(area).addClass(className);
		}
	}

	// tell the user what the current state of the store is
	function syncStatus() {
		var area = $(".syncButton");
		var unsynced = store().dirty();
		$(area).text(unsynced.length);
		renderIncomplete(store, bag.name);
	}

	// this loads the note with the given title from the active bag and loads it into the display
	function loadServerNote(title, bagname) {
		note = new tiddlyweb.Tiddler(title);
		note.fields = {};
		note.bag = new tiddlyweb.Bag(bagname || bag.name, host);
		store.get(note, function(tid, msg, xhr) {
			var is404 = xhr ? xhr.status === 404 : false;
			if(tid) {
				delete tid.fields.created;
				delete tid.fields.modified;
				note = tid;
			} else if(!is404) {
				resetNote();
			}
			if(store().title(note.title).bag(bag.name).dirty().length === 0) {
				if(tid) {
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
					notabene.addRecentChange(tid.bag.name, tid.title);
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
			var currentNote = $(".note_title").val();
			dirty.each(function(tid) {
				if(tid.title !== currentNote) {
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

		function startUp() {
			var currentUrl = window.location.hash;
			var match = currentUrl.match(/tiddler\/([^\/]+)$/);
			var newTiddler = currentUrl.match(/tiddler\/$/);
			if(match && match[1]) {
				var matchbag = currentUrl.match(/bags\/([^\/]*)\//);
				var noteBag = matchbag && decodeURIComponent(matchbag[1]) ? matchbag[1] : undefined;
				if(currentUrl.indexOf("quickedit/") > -1) {
					$("#newnote,#cancelnote").addClass("quickedit");
				}
				loadServerNote(decodeURIComponent(match[1]), noteBag);
			} else {
				if(!newTiddler && tiddlers[0]) {
					note = tiddlers[0];
					loadNote();
					// TODO: this is a bit hacky - without this the message will not fade out.
					setTimeout(function() {
						var html = ["We've restored your last incomplete note for you to finish and save. ", 
							"<a href='/takenote#tiddler/'>Start a new note</a> if you prefer."].join("");
						printMessage(html, "", true);
					}, 500);
				} else {
					newNote();
				}
				$(container).addClass("ready");
			}
			if(options.space) {
				$.ajax({
					url: "/spaces/" + options.space + "/members",
					error: function() {
						var html = ["You are not a member of this space. ",
							"Any notes you create will not be saved to the server. "].join("");
						printMessage(html, "error", false)
					}
				})
			}
		}
		startUp();
		if(window.addEventListener) {
			window.addEventListener("hashchange", startUp, true);
		}
	}

	// this stores the note locally (but not on the server)
	function isEmpty(note) {
		var emptyText = !note.text ? true : false;
		var noTitle = note.fields && note.fields._title_set ? false : true;
		return noTitle && emptyText ? true: false;
	}

	function storeNote() {
		note.fields._modified = new Date();
		if(!isEmpty(note)) {
			store.add(note);
		}
		syncStatus();
	}

	function renameNote(newtitle) {
		var old = note.title;
		if(newtitle !== old && !isEmpty(note)) {
			note.title = newtitle;
			store.add(note);
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
					callback(tiddler, null, null, xhr);
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

		validateNote(note, function(tiddler, valid, reserved, xhr) {
			//note = tiddler;
			if(valid) {
				fixTitle();
			} else if(valid === false) {
				renaming = true;
				var msg = reserved ? "This name is reserved and cannot be used. Please provide another."
					: "A note with this name already exists. Please provide another name."
				printMessage(msg, "error");
			}
			callback(valid, xhr);
		});
	}

	$(document).ready(function() {
		autoResize($("textarea.note_title")[0], { buffer: 0 });
		autoResize($(".note_text")[0], { minHeight: 250 });

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
	});

	function removeTag(tag) {
		var tags = note.tags || [];
		var newtags = [];
		for(var i = 0; i < tags.length; i++) {
			if(tags[i] !== tag) {
				newtags.push(tags[i]);
			}
		}
		note.tags = newtags;
		printMetaData(note);
	}
	function addTagToCurrentNote(tag) {
		var tags = note.tags || [];
		tag = ["excludeLists", "excludeSearch", "systemConfig", "excludeMissing"].indexOf(tag) > - 1 ? 
			tag : tag.toLowerCase();
		if(tags.indexOf(tag) === -1) {
			tags.push(tag);
		}
		note.tags = tags;
		printMetaData(note);
	}
	function findTags(note) {
		var tags = note.text.match(/#([^ \n#]+)/gi);
		var unique = [];
		for(var i = 0; i < tags.length; i++) {
			var tag = tags[i].substr(1);
			if(unique.indexOf(tag) === -1) {
				unique.push(tag);
			}
		}
		return unique;
	}
	function addTags() {
		var newtags = findTags(note);
		for(var i = 0; i < newtags.length; i++) {
			addTagToCurrentNote(newtags[i]);
		}
	}
	// every key press triggers a 'local' save
	var tag = [];
	var tagHandler = function(key) {
		if(key === 8) {
			tag.pop();
		} else if(key === 32 || key === 13) { // space or new line terminates tag
			if(tag.length > 1) {
				addTags();
			}
			tag = [];
		} else if(key === 35) { // hash symbol
			if(tag.length > 1) {
				addTags();
				tag = ["#"];
			} else {
				tag = ["#"];
			}
		} else if(tag.length > 0) {
			tag.push(String.fromCharCode(key));
		}
	};

	$(".note_text").keydown(function(ev) {
		note.text = $(ev.target).val();
		if(ev.keyCode === 8) {
			tagHandler(ev.keyCode);
		}
		storeNote();
	}).keypress(function(ev) {
		note.text = $(ev.target).val();
		tagHandler(ev.keyCode);
	}).keyup(function(ev) {
		note.text = $(ev.target).val();
		storeNote();
	}).blur(function(ev) {
		if(tag.length > 0) {
			addTags();
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

		// reset url
		window.location.hash = "";
		newNote();
		syncStatus();
	}

	// on clicking the "clear" button provide a blank note
	$("#newnote").click(function(ev) {
		printMessage("Saving note...");
		var quickedit = $(ev.target).hasClass("quickedit");

		validateCurrentNoteTitle(note.title, function(valid, xhr) {
			if(valid) {
				store.save(note, function(tid, options) {
					if(tid) {
						notabene.addRecentChange(tid.bag.name, note.title);
						$("#note").addClass("active");
						var encodedTitle = encodeURIComponent(note.title);
						if(quickedit) { // if quick edit has been signalled
							window.location = document.referrer || "/" + encodedTitle;
						} else {
							var url = "/bags/" + tid.bag.name + "/tiddlers/" + encodedTitle;
							var linkHtml = $("<div />").append(
								$("<a />").attr("href", url).text(note.title
								)).html();
							printMessage("Saved " + linkHtml + " successfully.", null, true);
						}
						resetNote();
					} else {
						// TODO: give more useful error messages (currently options doesn't provide this)
						if(xhr && xhr.status === 403) {
							printMessage("You are not logged into takenote." +
								"Please <a href='/challenge'>login</a> to post notes to the web.", "warning");
						} else {
							printMessage("Saved locally. Unable to post to web at current time.", "warning");
						}
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
					resetNote();
				} else {
					printMessage("Error deleting note. Please try again.", "error");
				}
			}); // TODO: ideally I would like to call store.removeTiddler(note) and not worry about syncing
		}
	});
	$("#cancelnote").click(function(ev) {
		var ok = confirm("Cancel editing this note and revert to previous online version?");
		if(ok) {
			var quickedit = $(ev.target).hasClass("quickedit");
			store.remove(note.title);
			resetNote();
			if(quickedit) {
				window.location = document.referrer || "/" + encodeURIComponent(note.title);
			}
		}
	});
	init();
	return {
		init: init,
		resetNote: resetNote,
		findTags: findTags,
		tagHandler: tagHandler,
		printMessage: printMessage,
		newNote: newNote,
		loadNote: loadNote,
		addTag: addTagToCurrentNote,
		removeTag: removeTag,
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
	function checkConnection() {
		if(_checking) {
			return;
		} else {
			_checking = true;
			$.ajax({ url: "/status",
				success: function(status) {
					internet = true;
					_checking = false;
					$("body").addClass("online");
					if(!initialised) {
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
	window.setInterval(checkConnection, 60000);
}

function renderIncomplete(store, bagname) {
	var tiddlers = store().dirty().sort(function(a, b) {
		return a.title < b.title ? -1 : 1;
	});
	var listIncomplete = $("#incomplete").empty()[0];
	if(listIncomplete) {
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
}

function dashboard(container, options) {
	notes(container, options);

	var list = $("#recentnotes");

	if(list.length > 0) {
		var sortRecent = function(a, b) {
			var title1 = typeof(a) === "string" ? a : a.title;
			var title2 = typeof(b) === "string" ? b : b.title;
			return title1 < title2 ? -1 : 1;
		};
		var recent = options.space ? notabene.getRecentChanges(options.space + "_private").
			concat(notabene.getRecentChanges(options.space + "_public")) :
			notabene.getRecentChanges(options.bag);
		function printRecentItems(recent) {
			if(recent.length === 0) {
				$("<li />").text("No recently created notes.").appendTo(list)[0];
			}
			for(var i = 0; i < recent.length; i++) {
				var li = $("<li />").appendTo(list)[0];
				var tid = recent[i];
				if(typeof(tid) === "string") {
					tid = { title: tid };
				}
				var bag = tid.bag || options.bag;
				$("<a />").attr("href",
					"/bags/" + bag + "/tiddlers/" + encodeURIComponent(tid.title)).
					text(tid.title).appendTo(li);
			}
		}
		printRecentItems(recent.sort(sortRecent));
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
		url: "/bags/" + options.bag + "/tiddlers?select=tag:!excludeLists",
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
				url: "/search?q=bag:" + options.bag + " \"" + term + " \"&select=tag:!excludeLists",
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

	var instance = setup_store(options);
	renderIncomplete(instance.store, instance.bag.name);
}

// show bookmark bubble if supported
window.addEventListener('load', function() {
	window.setTimeout(function() {
		var bubble = new google.bookmarkbubble.Bubble();

		var BUBBLE_STORAGE_KEY = 'bubble';

		bubble.setHashParameter = function() {
			localStorage.setItem(BUBBLE_STORAGE_KEY, "yes");
		};

		bubble.hasHashParameter = function() {
			return localStorage.getItem(BUBBLE_STORAGE_KEY) ? true : false;
		};

		bubble.getViewportHeight = function() {
			return window.innerHeight;
		};

		bubble.getViewportScrollY = function() {
			return window.pageYOffset;
		};

		bubble.registerScrollHandler = function(handler) {
			window.addEventListener('scroll', handler, false);
		};

		bubble.deregisterScrollHandler = function(handler) {
			window.removeEventListener('scroll', handler, false);
		};

		bubble.showIfAllowed();
	}, 1000);
}, false);

addEventListener("load", function() {
	setTimeout(hideURLbar, 0);
}, false);

function hideURLbar() {
	window.scrollTo(0, 1);
}
