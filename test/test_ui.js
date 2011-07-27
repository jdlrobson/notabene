var container, note, _confirm, _notabene;
function uisetup() {
	ajaxRequests = [];
	container = $("<div />").appendTo(document.body)[0];
	$("<textarea class='note_title' />").appendTo(container);
	$("<textarea class='note_text' />").appendTo(container);
	$("<a id='deletenote'>delete</a>").appendTo(container);
	$("<a id='newnote'>add</a>").appendTo(container);
	localStorage.clear();
	setConnectionStatus(true);
	_confirm = window.confirm;
	window.confirm = function() {
		return true;
	};
	_notabene = notabene;
	notabene = {
		watchPosition: NOP,
		addRecentChange: notabene.addRecentChange,
		getRecentChanges: notabene.getRecentChanges
	};
}

function uiteardown() {
	window.location.hash = "";
	setConnectionStatus(true);
	$(container).remove();
	container = null;
	note = null;
	localStorage.clear();
	window.confirm = _confirm;
	notabene = _notabene;
	ajaxRequests = [];
}

module('notabene ui (deletion from existing tiddler)', {
	setup: function() {
		uisetup();
		window.location.hash = "#!/tiddler/bar";
		note = notes(container, {
			host: "/",
			bag: "bag"
		});
	},
	teardown: uiteardown
});

test("sync without internet connection - issue 25", function() {
	// the setup has loaded the note with the name bar
	strictEqual($(".syncButton", container).length, 1, "a sync button shows up in the ui");
	strictEqual($(".syncButton", container).text(), "1", "it says there is one tiddler requiring syncing.");

	// kill internet
	setConnectionStatus(false);

	// confirm this note is ready
	$("#newnote").click();

	// attempt sync
	$(".syncButton").click();

	// check a sync error is shown
	strictEqual($(".messageArea", container).hasClass("warning"),
		true, "make sure the message reports that syncing was not possible.");

	strictEqual($(".syncButton", container).text(), "1",
		"Tiddler remains unsynced");
});

test('syncButton present', function() {
	// the setup has loaded the note with the name bar
	strictEqual($(".syncButton", container).length, 1, "a sync button shows up in the ui");
	strictEqual($(".syncButton", container).text(), "1", "it says there is one tiddler requiring syncing.");

	// start a new note
	setConnectionStatus(false);
	$("#newnote").click();

	$(".note_title", container).val("bar dum").blur();
	$(".note_text", container).val("text").keypress();
	$(".syncButton", container).click();
	strictEqual($(".syncButton", container).text(), "2", "it says there are now 2 tiddlers requiring syncing.");

	setConnectionStatus(true);
	$(".syncButton", container).click();
	var recentlist = notabene.getRecentChanges("bag");
	strictEqual(recentlist.length, 1, "1 recently created note recorded");
	strictEqual(recentlist[0], "bar", "check the title of bar is recorded properly");

	strictEqual($(".syncButton", container).text(), "1", "it says there is now only the current tiddler requiring syncing.");
	var dirty = note.store().dirty();
	strictEqual(dirty.length, 1, "1 tiddler marked as dirty");
	strictEqual(dirty[0].title, "bar dum", "bar dum (the current note being worked on) is the only unsynced note");
});

test('syncButton and successful save', function() {
	// the setup has loaded the note with the name bar
	strictEqual($(".syncButton", container).length, 1, "a sync button shows up in the ui");
	strictEqual($(".syncButton", container).text(), "1", "it says there is one tiddler requiring syncing.");

	// trigger save
	$("#newnote").click();
	strictEqual($(".syncButton", container).text(), "0",
		"a successful save will result in the number of notes to be synced to be 0");
	var recentlist = notabene.getRecentChanges("bag");
	strictEqual(recentlist.length, 1, "1 recently created note recorded");
	strictEqual(recentlist[0], "bar", "check the title of bar is recorded properly");
	// edit text
	$(".note_text").keyup();
	strictEqual($(".syncButton", container).text(), "1",
		"Now the number of notes to be synced to be 1 as text has been entered");
});

test("test clicking sync button", function() {
	// the setup has loaded the note with the name bar
	strictEqual($(".syncButton", container).text(), "1", "a sync button shows up in the ui");

	$(".syncButton").click();
	strictEqual($(".messageArea", container).text() != "", true, "a message is shown on a sync command");
	strictEqual($(".syncButton", container).text(), "1", "syncing doesn't save the currently loaded note.");
	strictEqual($(".messageArea", container).hasClass("warning"), true,
		"make sure the user knows there is nothing to sync.");
});

test('test deletion (from server and localStorage)', function() {
	// the setup has loaded the note with the name bar
	strictEqual(localStorage.length, 1, "a preloaded tiddler 'bar' should be saved locally.");
	strictEqual($(".syncButton", container).text(), "1", "a sync button shows up in the ui");

	// trigger a delete
	$("#deletenote").click();

	// this should delete the tiddler on the server (any ajax request to bar is successful - even delete)
	// and it should also delete the local version
	strictEqual(localStorage.length, 0, "there should no longer be anything in local storage.");
	strictEqual($(".syncButton", container).text(), "0", "sync button should show 0");
});

module('notabene ui (deletion from brand new tiddler)', {
	setup: function() {
		uisetup();
		note = notes(container, {
			host: "/",
			bag: "test_public"
		});
	},
	teardown:  uiteardown
});

test("issue 41", function() {
	$(".note_title").val("Test 45 ").blur();
	var tid = note.getNote();
	strictEqual(tid.title, "Test 45", "the title has been trimmed");
});

test("tag handling", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(102); // character f
	note.tagHandler(102);
	note.tagHandler(102);
	note.tagHandler(32); // new line
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 1, "now there is 1 tag");
	strictEqual(newTags[0], "fff", "check tag is correct");
});

test("tag handling space", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(102); // character f
	note.tagHandler(102);
	note.tagHandler(102);
	note.tagHandler(13); // space
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 1, "now there is 1 tag");
	strictEqual(newTags[0], "fff", "check tag is correct");
});

test("tag handling backspace", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(102); // character f
	note.tagHandler(102);
	note.tagHandler(102);
	note.tagHandler(8); // backspace
	note.tagHandler(13); // space
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 1, "now there is 1 tag");
	strictEqual(newTags[0], "ff", "check tag is correct");
});

test("tag handling clearing via backspace", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(102); // character f
	note.tagHandler(102);
	note.tagHandler(102);
	note.tagHandler(8); // backspace
	note.tagHandler(8); // backspace
	note.tagHandler(8); // backspace
	note.tagHandler(13); // space
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 0, "there is still no tags as only a hash was entered");
});

test("tag handling - series of hashes", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(35);
	note.tagHandler(35);
	note.tagHandler(13); // space
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 0,
		"there is still no tags as only a series of hashes was entered (restriction here that you cannot have tags with # in them)");
});

test("tagging vs list", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(13); // space
	note.tagHandler(102);
	note.tagHandler(32); // new line
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 0,
		"a list with 1 item was added - (# foo is list item - #foo is tag)");
});

test("#fff#g newline pattern", function() {
	var initialTags = note.getNote().tags;
	strictEqual(initialTags.length, 0, "no tags to start with");
	note.tagHandler(35); // hash symbol
	note.tagHandler(102); // f symbol
	note.tagHandler(102);
	note.tagHandler(102);
	note.tagHandler(35); // hash symbol
	note.tagHandler(103); // g symbol
	note.tagHandler(32); // new line
	var newTags = note.getNote().tags;
	strictEqual(newTags.length, 2, "2 tags registered");
	strictEqual(newTags[0], "fff", "the tag fff was cancelled by the hash that followed");
	strictEqual(newTags[1], "g", "g was cancelled by the new line");
});

test('test deletion (from local storage)', function() {
	strictEqual(localStorage.length, 0, "no tiddlers should be saved locally.");

	// note tiddler Test is not on the server accord to fixtures.js thus the title will be validated
	$(".note_title").val("Test").blur();

	// trigger a 'cache' to localStorage by typing in the textarea.
	$(".note_text").val("foo").keyup();
	strictEqual(localStorage.length, 1, "a tiddler should be saved locally.");

	// trigger a delete
	$("#deletenote").click();

	// this should clear the note from localStorage
	strictEqual(localStorage.length, 0, "after a delete there should no longer be anything in local storage.");
	strictEqual($(".note_title").val(), "", "note title should be reset (no longer 'Test')");
	strictEqual($(".note_title").attr("disabled"), undefined, "note title should no longer be disabled");
});

module('notabene ui refresh', {
	setup: uisetup, teardown:  uiteardown
});

test('issue 18', function() {
	strictEqual(localStorage.length, 0, "at start there is nothing locally cached.");
	// trigger a cache of a new tiddler into localStorage
	window.location.hash = "#!/tiddler/Test";
	note = notes(container, {
		host: "/",
		bag: "test_public"
	});
	$(".note_text").val("foo").keyup();
	strictEqual(localStorage.length, 1,
		"notes app is loaded, text entered (foo) and a cache is trigger. Now we should have something in localStorage");

	// we simulate a reboot
	$(".note_text,.note_title").val("");
	note = notes(container, {
		host: "/",
		bag: "test_public"
	});
	strictEqual($(".note_text").val(), "foo", "check the cached text has been loaded");
});

test('test failed save', function() {
	$(".note_text,.note_title").val("");
	note = notes(container, {
		host: "/",
		bag: "test_public"
	});
	strictEqual($(".syncButton", container).length, 1, "make sure a sync button is present");
	strictEqual($(".syncButton", container).text(), "0", "no tiddlers need syncing at start");

	// note tiddler Test is not on the server accord to fixtures.js thus the title will be validated
	$(".note_title").val("Test").blur();
	strictEqual($(".syncButton", container).text(), "1", "this should mean one tiddler needs syncing");

	// trigger a 'cache' to localStorage by typing in the textarea.
	$(".note_text").val("foo").keyup();

	// trigger a sync
	$("#newnote").click();

	// the save fails but we should be able to see the following
	strictEqual($(".messageArea:visible").text() != "", true, "a message should be printed");
	strictEqual($(".note_title").attr("disabled"), undefined, "note title should no longer be disabled");
	strictEqual($(".syncButton", container).text(), "1", "it says there is one tiddler requiring syncing.")

	// trigger a save of another tiddler;
	$(".note_title").val("Test2").blur();
	strictEqual($(".syncButton", container).text(), "2", "two tiddlers now needs syncing");

	// trigger another failed save
	$("#newnote").click();
	strictEqual($(".syncButton", container).text(), "2", "two tiddlers still needs syncing");
	strictEqual($(".note_title").attr("disabled"), undefined, "and title should no longer be disabled");
});

test("issue 23", function() {
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	// edit text
	$(".note_text").val("hello").keyup();

	// we simulate a reboot
	$(".note_text,.note_title").val("");
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	strictEqual($(".note_title").val(), "",
		"The title of the note is still blank as hasn't been set yet.")
});

test("issue 28", function() {
	// note a tiddler already exists called bar
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	// kill internet
	setConnectionStatus(false);
	$(".note_title").val("bar").blur();
	$(".note_text").val("evil!!!").keypress();

	// confirm this note is ready
	$("#newnote").click();

	// attempt sync with internet
	setConnectionStatus(true);

	$(".syncButton").click();

	// check a sync error is shown
	strictEqual($(".messageArea", container).hasClass("error"),
		true, "make sure the message reports that syncing was not possible.");

	strictEqual($(".syncButton", container).text(), "1",
		"Tiddler remains unsynced");
});

test('issue 27', function() {
	// trigger a cache of a new tiddler into localStorage
	note = notes(container, {
		host: "/",
		bag: "bag"
	});

	// kill internet
	setConnectionStatus(false);

	// set the title
	$(".note_title", container).val("bar").blur();
	note.validateCurrentNoteTitle("bar");

	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, undefined, "The title should not be validated.");

	// turn on internet
	setConnectionStatus(true);

	// set the title with internet
	$(".note_title", container).val("bar").blur();
	note.validateCurrentNoteTitle("bar");

	strictEqual(tid.fields._title_validated, undefined, "A note already has this name.");
	strictEqual($(".messageArea").text() != "", true,
		"a message should be printed notifying the user of this situation.");
	strictEqual($(".note_title", container).attr("disabled"), undefined,
		"should be possible to still edit title");

	// we simulate a reboot
	$(".note_text,.note_title").val("");
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	strictEqual($(".note_title", container).attr("disabled"), undefined,
		"should ***still*** be possible to still edit title");
	strictEqual($(".note_title", container).val(), "bar",
		"even though title was not validated should still be displayed/stored");

	// change name to something which DOESN'T exist on server 
	$(".note_title", container).val("bar dum").blur();
	note.validateCurrentNoteTitle("bar dum");
	tid = note.getNote();
	strictEqual(tid.fields._title_validated, "yes", "Now the note title should be validated.");
});

test('name a note after existing note without connection, prevent overwriting', function() {
	note = notes(container, {
		host: "/",
		bag: "bag"
	});

	strictEqual(note.store().dirty().length, 0, "no dirty tiddlers to start with");
	// kill internet
	setConnectionStatus(false);

	// set the title without internet - wont be able to validate.
	$(".note_title", container).val("bar").blur();
	$(".note_text", container).val("Hello there!");

	strictEqual(note.store().dirty().length, 1,
		"the store is now dirty with this note");

	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, undefined, "No connection so cannot validate note.");

	// try to save.
	$("#newnote", container).click();

	// note cannot be validated, so make sure the note is not synced
	strictEqual(note.store().dirty().length, 1,
		"the note is still dirty as the title has not been validated and without internet connection cannot sync");
	strictEqual($(".messageArea").text() != "", true,
		"a message should be printed notifying the user of this situation.");
	strictEqual($(".note_title", container).val(), "", "A new note can be started");
});

test('renaming to empty string', function() {
	note = notes(container, {
		host: "/",
		bag: "bag"
	});

	setConnectionStatus(false);
	// set the title without internet
	$(".note_title", container).val("bar").blur();
	var tid1 = note.getNote();
	strictEqual(tid1.fields._title_set, "yes", "the title has been set by the user");
	$(".note_title", container).val("").blur();
	strictEqual(note.getNote().fields._title_set, undefined, "the title has no longer been set by the user");
	// trigger reload
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	var tid = note.getNote();
	strictEqual(tid.fields._title_set, undefined, "the title is no longer set");
	strictEqual(tid.title != tid1.title, true, "the actual title is different");
	strictEqual($(".note_title").val(), "");
});

test('saving a tiddler with unvalidated title', function() {
	note = notes(container, {
		host: "/",
		bag: "bag"
	});

	strictEqual(note.store().dirty().length, 0, "no dirty tiddlers to start with");
	// kill internet
	setConnectionStatus(false);

	// set the title without internet
	$(".note_title", container).val("bar").blur();
	note.validateCurrentNoteTitle("bar");

	strictEqual(note.store().dirty().length, 1, "now one dirty tiddler");
	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, undefined, "No connection so cannot validate note.");
	strictEqual(tid.title, "bar", "The note has the name bar");

	// internet back on
	setConnectionStatus(true);

	// try to save.
	$("#newnote", container).click();

	// note cannot be validated, so make sure the note is not synced
	strictEqual(note.store().dirty().length, 1, "the note is still dirty as the title has not been validated");
	strictEqual($(".messageArea").text() != "", true,
		"a message should be printed notifying the user of this situation.");
	strictEqual($(".messageArea", container).hasClass("error"), true,
		"an error message should prompt the note to be renamed.");
	strictEqual($(".note_title").val(), "bar", "the note should still be in view");

	$(".note_title", container).val("bar dum").blur();
	note.validateCurrentNoteTitle("bar dum");
	// this doesnt exist so will be validated
	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, "yes", "Note validated");
	var dirty = note.store().dirty();
	strictEqual(dirty.length, 1,
		"only one tiddler dirty");
	strictEqual(dirty[0].title, "bar dum", "the title of the dirty note is bar dum");
});

// note in this situation it may be useful to just delete the local tiddler.
// how do we detect a delete doesnt occur
test('deleting an unvalidated tiddler', function() {
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	// set title to a tiddler that already exists
	$(".note_title", container).val("bar").blur();
	$(".note_text", container).val("hello").keyup();
	strictEqual(note.store().dirty().length, 1, "one tiddler now dirty");
	strictEqual(note.getNote().fields._title_validated, undefined, "title has not been validated");
	// now attempt to delete
	var beforeDelete = ajaxRequests.length;
	$("#deletenote").click();
	strictEqual(note.store().dirty().length, 0,
		"the local tiddler is removed but NOT the server version");
	strictEqual(ajaxRequests.length - beforeDelete, 0, "no ajax requests were made so server version NOT touched!");
});

test('deleting validated tiddler without internet connection', function() {
	// trigger a cache of a new tiddler into localStorage
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	// set the title
	$(".note_title", container).val("bar dum").blur();
	note.validateCurrentNoteTitle("bar dum");
	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, "yes", "Now the note title should be validated.");
	strictEqual(note.store().dirty().length, 1,
		"the note is now dirty");
	// turn off internet
	setConnectionStatus(false);

	// attempt delete
	$("#deletenote").click();
	strictEqual(note.store().dirty().length, 1,
		"the note is still dirty as we failed to delete it off server (no 404 or success)");
	strictEqual($(".messageArea", container).hasClass("warning"), true, "warning message printed");
	strictEqual($(".note_title", container).val(), "", "note title has now been reset");
});

test("retain title on slow validation", function() {
	note = notes(container, {
		host: "/",
		bag: "slow"
	});
	$(".note_title", container).val("slow").blur();
	strictEqual(note.getNote().title, "slow",
		"even though the validation takes time to happen if the user hits refresh we need to make sure the title is retained")
});

test('issue 38', function() {
	// trigger a cache of a new tiddler into localStorage
	note = notes(container, {
		host: "/",
		bag: "bag"
	});

	// set the title
	$(".note_title", container).val("takenote").blur();

	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, undefined, "The title should not be validated.");
});

module("500 tiddler", {
	setup: function() {
		uisetup();
		window.location.hash = "#/tiddler/500";
		note = notes(container, {
			host: "/",
			bag: "bag"
		});
	},
	teardown: function() {
		uiteardown();
		window.location.hash = "";
	}
});

test("issue 46", function() {
	strictEqual($(".note_title").val(), "",
		"the request for tiddler called 500 throws a server error so is not loaded into the ui");
	strictEqual($(".note_text").val(), "",
		"the request for tiddler called 500 throws a server error so text is not loaded into the ui");
});

module("unvalidated tiddler", {
	setup: function() {
		uisetup();
		localStorage.setItem("bag/bar",
			'{ "text": "!!", "fields": {} }'); // add unvalidated tiddler
		window.location.hash = "#/tiddler/bar";
	},
	teardown: function() {
		uiteardown();
		window.location.hash = "";
	}
});

test("issue 42", function() {
	note = notes(container, {
		host: "/",
		bag: "bag"
	});
	var tid = note.getNote();
	strictEqual(tid.text, "!!", "Even though the note exists on the server we want to retrieve the cached version");
	strictEqual(tid.fields._title_validated, undefined, "the title of the note has not been validated");
	strictEqual($(".note_text").val(), "!!", "text correct");
	strictEqual($(".note_title").val(), "bar", "title correct");
});
