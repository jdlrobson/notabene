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

module('notabene ui refresh', {
	setup: uisetup, teardown:  uiteardown
});

test('issue 18', function() {
	strictEqual(localStorage.length, 0, "at start there is nothing locally cached.");
	// trigger a cache of a new tiddler into localStorage
	note = notes(container, {
		host: "/",
		bag: "test_public",
		pathname: "notabene/tiddler/Test"
	});
	$(".note_text").val("foo").keyup();
	strictEqual(localStorage.length, 1,
		"notes app is loaded, text entered (foo) and a cache is trigger. Now we should have something in localStorage");

	// we simulate a reboot
	$(".note_text,.note_title").val("");
	note = notes(container, {
		host: "/",
		bag: "test_public",
		pathname: "notabene/tiddler/Test"
	});
	strictEqual($(".note_text").val(), "foo", "check the cached text has been loaded");
});
