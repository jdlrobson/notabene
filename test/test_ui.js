var container, note, _confirm;
function uisetup() {
	container = $("<div />").appendTo(document.body)[0];
	$("<textarea class='note_title' />").appendTo(container);
	$("<textarea class='note_text' />").appendTo(container);
	$("<a id='deletenote'>delete</a>").appendTo(container);
	$("<a id='#newnote'>add</a>").appendTo(container);
	localStorage.clear();
	_confirm = window.confirm;
	window.confirm = function() {
		return true;
	};
}

function uiteardown() {
	$(container).remove();
	container = null;
	note = null;
	localStorage.clear();
	window.confirm = _confirm;
}

module('notabene ui (deletion from existing tiddler)', {
	setup: function() {
		uisetup();
		note = notes(container, {
			host: "/",
			bag: "bag",
			pathname: "notabene/tiddler/bar"
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
	strictEqual($(".syncButton", container).length, 1, "a sync button shows up in the ui");

	$(".syncButton").click();
	strictEqual($(".syncButton", container).length, 0, "syncing pushes all tiddlers up to server");
});

test('test deletion (from server and localStorage)', function() {
	// the setup has loaded the note with the name bar
	strictEqual(localStorage.length, 1, "a preloaded tiddler 'bar' should be saved locally.");

	// trigger a delete
	$("#deletenote").click();

	// this should delete the tiddler on the server (any ajax request to bar is successful - even delete)
	// and it should also delete the local version
	strictEqual(localStorage.length, 0, "there should no longer be anything in local storage.");
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
	strictEqual($(".note_title").attr("disabled"), false, "note title should no longer be disabled");
});

test('test failed save', function() {
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
