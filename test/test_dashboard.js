var store;
module('notabene dashboard - 2 tiddlers in store', {
	setup: function() {
		localStorage.setItem("takenote-recent-bar", '["foo", "bar", "test with spaces!>"]');
		store = new tiddlyweb.Store();
		var tid = new tiddlyweb.Tiddler("foo", new tiddlyweb.Bag("bar"));
		var tid2 = new tiddlyweb.Tiddler("foo 2", new tiddlyweb.Bag("bar"));
		dashboard(document.body, { bag: "bar", host: "/" });
		store.add(tid);
		store.add(tid2);
		$("<ul id='recentnotes' />").appendTo(document.body);
		$("<ul id='incomplete' />").appendTo(document.body);
		dashboard(document.body, { bag: "bar", host: "/" });
	},
	teardown: function() {
		store = null;
		localStorage.clear();
		$("#incomplete,#recentnotes").remove();
	}
});

test('load incomplete notes', function() {
	strictEqual($("#incomplete li").length, 2, "two notes are listed");
	strictEqual($("#incomplete li a").length, 2, "both notes have links");
	var secondItem = $("#incomplete li")[1];
	strictEqual($(secondItem).text(), "foo 2", "the second note has the title foo 2")
	strictEqual($("a", secondItem).attr("href"), "/takenote#!/tiddler/foo 2", "check the link points to the app");
});

test('print recent notes (there are recent notes)', function() {
	strictEqual($("#recentnotes li").length, 3, "three items listed");
	var links = $("#recentnotes li a");
	var firstLink = $(links[0]);
	var thirdLink = $(links[2]);
	strictEqual(firstLink.text(), "bar", "the recent notes are sorted alphabetically");
	strictEqual(thirdLink.text(), "test with spaces!>", "the recent notes are sorted alphabetically");
	strictEqual(thirdLink.attr("href"), "/bags/bar/tiddlers/test%20with%20spaces!%3E",
		"link correct and properly encoded");
});

module('notabene dashboard - empty store', {
	setup: function() {
		store = new tiddlyweb.Store();
		$("<ul id='incomplete' />").appendTo(document.body);
		$("<ul id='recentnotes' />").appendTo(document.body);
		dashboard(document.body, { bag: "bar", host: "/" });
	},
	teardown: function() {
		store = null;
		localStorage.clear();
		$("#incomplete,#recentnotes").remove();
	}
});

test('load incomplete notes (empty store)', function() {
	strictEqual($("#incomplete li").length, 1, "one item listed");
	strictEqual($("#incomplete li").text(), "None.", "the user can see there is none.");
	strictEqual($("#incomplete li a").length, 0, "no links");
});

test('print recent notes (none)', function() {
	strictEqual($("#recentnotes li").length, 1, "one item listed");
	strictEqual($("#recentnotes li").text(), "No recently created notes.",
		"the user can see there is none.");
	strictEqual($("#recentnotes li a").length, 0, "no links");
});
