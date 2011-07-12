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
		watchPosition: NOP
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

test('syncButton present', function() {
	// the setup has loaded the note with the name bar
	strictEqual($(".syncButton", container).length, 1, "a sync button shows up in the ui");
	strictEqual($(".syncButton", container).text(), "1", "it says there is one tiddler requiring syncing.");
});

test('syncButton and successful save', function() {
	// the setup has loaded the note with the name bar
	strictEqual($(".syncButton", container).length, 1, "a sync button shows up in the ui");
	strictEqual($(".syncButton", container).text(), "1", "it says there is one tiddler requiring syncing.");

	// trigger save
	$("#newnote").click();
	strictEqual($(".syncButton", container).text(), "0",
		"a successful save will result in the number of notes to be synced to be 0");
	
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
	strictEqual($(".syncButton", container).text(), "0", "syncing pushes all tiddlers up to server");
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

	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, undefined, "The title should not be validated.");

	// turn on internet
	setConnectionStatus(true);

	// set the title with internet
	$(".note_title", container).val("bar").blur();
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
