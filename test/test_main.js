var container, note, _notabene;

function setupNotabeneMock() {
	_notabene = notabene;
	notabene = {
		saveConfig: NOP,
		watchPosition: function(handler) {
			handler({ coords: { latitude: 10, longitude: 20 } });
		},
		addRecentChange: function() {}
	};
}

module('helper functions', {});

test("addRecentChange", function() {
	notabene.addRecentChange("test","foo"); // [foo]
	notabene.addRecentChange("test","bar"); // [foo,bar]
	notabene.addRecentChange("test","dum"); // [foo,bar,dum]
	notabene.addRecentChange("test","hello"); // [foo,bar,dum,hello]
	notabene.addRecentChange("test","goodbye"); // [foo,bar,dum,hello,goodbye]
	notabene.addRecentChange("test","foo"); // add duplicate [bar,dum,hello,goodbye,foo]
	notabene.addRecentChange("test","thanks"); // [dum,hello,goodbye,foo,thanks]
	notabene.addRecentChange("test","bar"); // add duplicate [hello,goodbye,foo,thanks,bar]
	var recent = notabene.getRecentChanges("test");
	strictEqual(recent.length, 5, "there should be 5 recent changes");
	/* recent changes should always give a list of the 5 most recently changed notes.
	The first will be the oldest modified, the last the most recently saved.
	There should be no duplicates.
	*/
	strictEqual(recent[0].title, "hello", "the first note in this list should be this one (see test comments)");
	strictEqual(recent[1].title, "goodbye", "check list order");
	strictEqual(recent[2].title, "foo", "check list order");
	strictEqual(recent[3].title, "thanks", "check list order");
	strictEqual(recent[4].title, "bar", "check list order");
});

test("addRecentChange (repeat for same tiddler)", function() {
	notabene.addRecentChange("test","foo");
	notabene.addRecentChange("test","foo");
	notabene.addRecentChange("test","foo");
	notabene.addRecentChange("test","foo");
	var recent = notabene.getRecentChanges("test");
	strictEqual(recent.length, 1, "there should be 1 recent change");
	strictEqual(recent[0].title, "foo", "the first note in this list should be this one (see test comments)");
});

module('notabene', {
	setup: function() {
		container = $("<div />").appendTo(document.body)[0];
		$("<textarea class='note_title' />").appendTo(container);
		$("<textarea class='note_text' />").appendTo(container);
		localStorage.clear();
		setupNotabeneMock()
		note = notes(container, {
			host: "/",
			bag: "bag"
		});
	},
	teardown: function() {
		$(container).remove();
		container = null;
		note = null;
		notabene = _notabene;
		localStorage.clear();
	}
});

test('startup behaviour (no notes in storage)', function() {
	strictEqual($(".note_title", container).attr("disabled"), undefined, "check title is not disabled");
	strictEqual($(".note_text", container).attr("disabled"), undefined, "check text is not disabled");
	strictEqual($(".note_title", container).val(), "", "check no value for title");
});

test('test geo', function() {
	var tid = note.getNote();
	strictEqual(tid.fields['geo.lat'], "10", "test latitude was set");
	strictEqual(tid.fields['geo.long'], "20", "test longitude was set");
});

test('name clashes', function() {
	// user suggests a name and triggers a focus event
	$(".note_title", container).val("bar").blur();
	note.validateCurrentNoteTitle("bar");

	//however a tiddler with this name already exists on the server thus..
	strictEqual($(".note_title", container).attr("disabled"), undefined, "the title remains enabled ready for input");
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

test('printMessage twice', function() {
	note.printMessage("foo", "bar");
	note.printMessage("foo", "dum");
	strictEqual($(".messageArea", container).hasClass("bar"), false,
		"classes should get reset every call to printMessage");
});

test('loadServerNote', function() {
	note.loadServerNote("bar");
	strictEqual($(container).hasClass("ready"), true,
		"check the ajax request was a success and the container has class ready");
	var activeNote = note.getNote();
	strictEqual(activeNote.text, "The correct text",
		"The correct text was loaded via ajax into the current note");
});

test('loadServerNote (specify bag)', function() {
	note.loadServerNote("bar", "x_public");
	strictEqual($(container).hasClass("ready"), true,
		"check the ajax request was a success and the container has class ready");
	var activeNote = note.getNote();
	strictEqual(activeNote.text, "The correct text from bag x",
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
				'"_title_set": "yes", ',
				'"geo.lat": "34", "geo.long": "1", ',
				'"_title_validated":"yes","modified":"2011-06-22T11:49:16.977Z"},"text":"foo"}'].join(""));
		setupNotabeneMock();
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
		notabene = _notabene;
	}
});

test('startup behaviour (load last note from cache)', function() {
	strictEqual($(".note_title", container).attr("disabled"), "disabled", "check title is disabled (has been set previously)");
	strictEqual($(".note_text", container).attr("disabled"), undefined, "can still edit the text though");
	strictEqual($(".note_title", container).val(), "Test", "check the value of title is correct");
	strictEqual($(".note_text", container).val(), "foo",
		"check the value of text is preset to the one in cache");
});

test('test geo with existing geodata', function() {
	var tid = note.getNote();
	strictEqual(tid.fields['geo.lat'], "34", "test latitude was retained");
	strictEqual(tid.fields['geo.long'], "1", "test longitude was retained");
});


module('notabene (as visited from /takenote#!/tiddler/bar)', {
	setup: function() {
		localStorage.clear();
		container = $("<div />").appendTo(document.body)[0];
		$("<textarea class='note_title' />").appendTo(container);
		$("<textarea class='note_text' />").appendTo(container);
		window.location.hash = "#!/tiddler/bar";
		note = notes(container, {
			host: "/",
			bag: "bag"
		});
	},
	teardown: function() {
		$(container).remove();
		window.location.hash = "";
		container = null;
		note = null;
		localStorage.clear();
	}
});

test('startup behaviour (load a note on the server NOT in cache)', function() {
	strictEqual($(".note_title", container).attr("disabled"), "disabled", "check title is disabled (has been set previously)");
	strictEqual($(".note_text", container).attr("disabled"), undefined, "can still edit the text though");
	strictEqual($(".note_title", container).val(), "bar", "check the value of title is correct");
	strictEqual($(".note_text", container).val(), "The correct text",
		"The correct text is loaded from the server via ajax");
});

module('notabene (as visited from /takenote#!/tiddler/bar%20dum)', {
	setup: function() {
		localStorage.clear();
		container = $("<div />").appendTo(document.body)[0];
		$("<textarea class='note_title' />").appendTo(container);
		$("<textarea class='note_text' />").appendTo(container);
		$("<a id='newnote'>save</a>").appendTo(container);
		$("<div />").attr("id", "notemeta").appendTo(container);
		setupNotabeneMock();
		window.location.hash = "#!/tiddler/bar%20dum";
		note = notes(container, {
			host: "/",
			bag: "bag"
		});
	},
	teardown: function() {
		window.location.hash = "";
		$(container).remove();
		container = null;
		note = null;
		localStorage.clear();
		notabene = _notabene;
	}
});

test('startup behaviour (load a note with preset name not on the server)', function() {
	strictEqual($(".note_title", container).attr("disabled"), "disabled", "check title gets accepted thus disabled");
	strictEqual($(".note_text", container).attr("disabled"), undefined, "can still edit the text though");
	strictEqual($(".note_title", container).val(), "bar dum", "check the value of title is correct");
});

test('saving a pre-existing note', function() {
	$("#newnote").click();

	strictEqual($(".note_title", container).attr("disabled"), undefined, "title no longer disabled");
	strictEqual($(".note_title", container).val(), "", "empty input waiting for user input");
	strictEqual(window.location.hash, "", "the hash has been reset");
});

test("print meta data", function() {
	var tid = new tiddlyweb.Tiddler("xyz", new tiddlyweb.Bag("foo", "/"));
	tid.fields = { bar: "x", foo: "y" };
	note.printMetaData(tid);
	strictEqual($("#notemeta li").length, 2, "the two fields are printed");
});

test("tagging (scanning)", function() {
	var tiddler = new tiddlyweb.Tiddler("bar");
	tiddler.text = ["#tag # not tag test", "#hello world", "#foo","dsfssfg #goodbye#","hello world",
		"list follows", "# 1", "# 2", "# 3", "#tag"].join("\n");
	var tags = note.findTags(tiddler);
	// should find tags 'tag' 'foo' 'goodbye' and 'hello'
	strictEqual(tags.length, 4, "only 4 tags found");
	strictEqual(tags.indexOf("tag") > -1, true, "the tag 'tag' is found");
	strictEqual(tags.indexOf("hello") > -1, true, "the tag 'hello' is found");
	strictEqual(tags.indexOf("goodbye") > -1, true, "the tag 'goodbye' is found");
	strictEqual(tags.indexOf("foo") > -1, true, "the tag 'foo' is found");
});

test("tagging (adding)", function() {
	note.addTag("foo");
	note.addTag("bar");
	note.addTag("foo");
	note.addTag("dum");
	var tid = note.getNote();
	strictEqual(tid.tags.length, 3, "foo bar and dum are added - no duplicates");
});

test("tagging (adding)", function() {
	note.addTag("foo");
	note.addTag("bar");
	note.removeTag("dum"); // doesn't exist
	note.removeTag("bar");
	var tid = note.getNote();
	strictEqual(tid.tags.length, 1, "only foo remains");
	strictEqual(tid.tags[0], "foo", "only foo remains");
});

test("print with hidden meta data", function() {
	var tid = new tiddlyweb.Tiddler("xyz", new tiddlyweb.Bag("foo", "/"));
	tid.fields = { bar: "x", foo: "y", _hidden: "foo" };
	note.printMetaData(tid);
	strictEqual($("#notemeta li").length, 2, "the two fields are printed, _hidden is ignored");
});
