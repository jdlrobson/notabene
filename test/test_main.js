var container, note;
module('notabene', {
	setup: function() {
		container = $("<div />")[0];
		note = notes("bag", "/", container);
		localStorage.clear();
	},
	teardown: function() {
		container = null;
		note = null;
		localStorage.clear();
	}
});

test('startup behaviour (no notes in storage)', function() {
	$("<textarea class='note_title' />").appendTo(container);
	$("<textarea class='note_text' />").appendTo(container);
	strictEqual($(".note_title", container).attr("disabled"), false, "check title is not disabled");
	strictEqual($(".note_text", container).attr("disabled"), false, "check text is not disabled");
	strictEqual($(".note_title", container).val(), "", "check no value for title");
});

test('printMessage (with message area)', function() {
	$("<div class='messageArea' />").appendTo(container);
	note.printMessage("foo", "bar");
	strictEqual($(".messageArea", container).hasClass("bar"), true,
		"check the class has been set in message area");
});


test('printMessage (no message area)', function() {
	note.printMessage("foo", "bar");
	strictEqual($(".messageArea", container).hasClass("bar"), true,
		"check the class has been set in message area");
});

test('loadServerNote', function() {
	note.loadServerNote("bar");
	strictEqual($(container).hasClass("ready"), true,
		"check the ajax request was a success and the container has class ready");
	var activeNote = note.getNote();
	strictEqual(activeNote.text, "The correct text",
		"The correct text was loaded via ajax into the current note");
});
