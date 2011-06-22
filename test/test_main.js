var container, note;
module('notabene', {
	setup: function() {
		container = $("<div />").appendTo(document.body)[0];
		$("<textarea class='note_title' />").appendTo(container);
		$("<textarea class='note_text' />").appendTo(container);
		localStorage.clear();
		note = notes(container, {
			host: "/",
			bag: "bag"
		});
	},
	teardown: function() {
		$(container).remove();
		container = null;
		note = null;
		localStorage.clear();
	}
});

test('startup behaviour (no notes in storage)', function() {
	strictEqual($(".note_title", container).attr("disabled"), false, "check title is not disabled");
	strictEqual($(".note_text", container).attr("disabled"), false, "check text is not disabled");
	strictEqual($(".note_title", container).val(), "", "check no value for title");
});

test('name clashes', function() {
	// user suggests a name and triggers a focus event
	$(".note_title", container).val("bar").blur();

	//however a tiddler with this name already exists on the server thus..
	strictEqual($(".note_title", container).attr("disabled"), false, "the title remains enabled ready for input");
	strictEqual($(".messageArea:visible", container).length, 1, "message area should be visible");
	strictEqual($(".messageArea", container).html() != "", true, "message area should have some text");
	var tid = note.getNote();
	strictEqual(tid.fields._title_validated, undefined, "This field should not be set");
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

module('notabene (notes in cache)', {
	setup: function() {
		localStorage.clear();
		container = $("<div />").appendTo(document.body)[0];
		$("<textarea class='note_title' />").appendTo(container);
		$("<textarea class='note_text' />").appendTo(container);
		localStorage.setItem("test_public/Test",
			['{"fields":{"created":"2011-06-22T11:49:03.951Z",',
				'"_title_validated":"yes","modified":"2011-06-22T11:49:16.977Z"},"text":"foo"}'].join(""));
		note = notes(container, {
			host: "/",
			bag: "test_public"
		});
	},
	teardown: function() {
		$(container).remove();
		container = null;
		note = null;
		localStorage.clear();
	}
});

test('startup behaviour (load last note from cache)', function() {
	strictEqual($(".note_title", container).attr("disabled"), true, "check title is disabled (has been set previously)");
	strictEqual($(".note_text", container).attr("disabled"), false, "can still edit the text though");
	strictEqual($(".note_title", container).val(), "Test", "check the value of title is correct");
	strictEqual($(".note_text", container).val(), "foo",
		"check the value of text is preset to the one in cache");
});

module('notabene (as visited from /notabene/tiddler/bar)', {
	setup: function() {
		localStorage.clear();
		container = $("<div />").appendTo(document.body)[0];
		$("<textarea class='note_title' />").appendTo(container);
		$("<textarea class='note_text' />").appendTo(container);
		note = notes(container, { pathname: "notabene/tiddler/bar",
			host: "/",
			bag: "bag"
		});
	},
	teardown: function() {
		$(container).remove();
		container = null;
		note = null;
		localStorage.clear();
	}
});

test('startup behaviour (load a note on the server NOT in cache)', function() {
	strictEqual($(".note_title", container).attr("disabled"), true, "check title is disabled (has been set previously)");
	strictEqual($(".note_text", container).attr("disabled"), false, "can still edit the text though");
	strictEqual($(".note_title", container).val(), "bar", "check the value of title is correct");
	strictEqual($(".note_text", container).val(), "The correct text",
		"The correct text is loaded from the server via ajax");
});
