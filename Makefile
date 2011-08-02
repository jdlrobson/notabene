clean: cleanlocal cleanremote

cleanlocal: cleanmeta
	rm -rf build tmp b64

cleanremote:
	rm -rf src/chrjs.js src/chrjs-store.js src/jquery.min.js src/jquery-json.min.js src/bg.png src/require.js 

remotes: clean
	curl -o src/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/master/dist/chrjs-store-0.3.0.min.js
	curl -o src/jquery.min.js \
		http://code.jquery.com/jquery-1.6.1.min.js
	curl -o src/jquery-json.min.js \
		http://jquery-json.googlecode.com/files/jquery.json-2.2.min.js
	curl -o src/require.js \
		http://requirejs.org/docs/release/0.24.0/minified/require.js
	curl -o src/bg.png \
		http://frontpage.tiddlyspace.com/bags/frontpage_public/tiddlers/darknoiseradiallarge.jpg

devlocal: remotes
	echo "open http://0.0.0.0:8080/static/edit.html"
	twanager bag test_public < bag.json
	echo "\n\nrun twanager server && open http://0.0.0.0:8080/static/edit.html\n\n"

compress:
	java -jar yuicompressor-2.4.6.jar src/notabene.js -o build/notabene.js
	java -jar yuicompressor-2.4.6.jar src/notabene.css -o build/notabene.css
	java -jar yuicompressor-2.4.6.jar --type css src/HtmlCss -o build/HtmlCss

cleanmeta:
	rm -f src/notabene.js.meta
	rm -f src/htmljs-takenoteedit.js.meta
	rm -f src/chrjs.js.meta
	rm -f src/chrjs-store.js.meta
	rm -f src/require.js.meta
	rm -f src/jquery.min.js.meta
	rm -f src/bubble.js.meta
	rm -f src/jquery-json.min.js.meta
	rm -f src/jquery-ui.min.js.meta
	rm -f build/notabene.js.meta
	rm -f build/notabene.css.meta
	rm -f src/notabene.css.meta
	rm -f src/jquery-ui.css.meta
	rm -f src/HtmlCss.meta
	rm -f build/HtmlCss.meta
	rm -f src/dashboard.meta
	rm -f src/takenote.meta
	rm -f src/manifest.mf.meta

meta:
	rm -rf build
	mkdir build
	cp src/javascript.meta src/notabene.js.meta
	cp src/javascript.meta src/htmljs-takenoteedit.js.meta
	cp src/javascript.meta src/chrjs.js.meta
	cp src/javascript.meta src/chrjs-store.js.meta
	cp src/javascript.meta src/require.js.meta
	cp src/javascript.meta src/jquery.min.js.meta
	cp src/javascript.meta src/bubble.js.meta
	cp src/javascript.meta src/jquery-json.min.js.meta
	cp src/javascript.meta src/jquery-ui.min.js.meta
	cp src/javascript.meta build/notabene.js.meta
	cp src/css.meta build/notabene.css.meta
	cp src/css.meta src/notabene.css.meta
	cp src/css.meta src/jquery-ui.css.meta
	cp src/css.meta src/HtmlCss.meta
	cp src/css.meta build/HtmlCss.meta
	cp src/html.meta src/takenote.meta
	cp src/html.meta src/dashboard.meta
	cp src/manifest.meta src/manifest.mf.meta

basesixtyfour:
	rm -rf tmp_b64
	mkdir tmp_b64
	python b64.py cancel.png 'image/png'
	python b64.py touchicon.png 'image/png'
	python b64.py saveTiddler.png 'image/png'
	python b64.py delete.png 'image/png'
	python b64.py bg.png 'image/png'
	python b64.py icon-recent.png 'image/png'
	python b64.py icon-incomplete.png 'image/png'
	python b64.py icon-search.png 'image/png'

dev: meta basesixtyfour
	./upload.sh takenotedev 'src/notabene.js' 'src/notabene.css' 'src/chrjs-store.js' 'src/chrjs.js' 'tmp_b64/touchicon.png.tid' \
		'src/jquery-ui.css' 'src/jquery-ui.min.js' 'tmp_b64/bg.png.tid' 'tmp_b64/delete.png.tid' 'tmp_b64/saveTiddler.png.tid' \
		'src/require.js' 'tmp_b64/icon-search.png.tid' 'tmp_b64/icon-incomplete.png.tid' 'tmp_b64/icon-recent.png.tid' \
		'tmp_b64/cancel.png.tid' 'src/HtmlCss' 'src/HtmlJavascript.tid' 'src/htmljs-takenoteedit.js' \
		'src/bubble.js' \
		'src/dashboard' 'src/takenote' 'src/jquery.min.js' 'src/jquery-json.min.js'

dist: remotes meta compress
	./upload.sh takenote 'build/notabene.js' 'build/notabene.css' 'src/chrjs-store.js' \
		'src/jquery-json.min.js' 'src/jquery.min.js' 'src/takenote' \
		'src/jquery-ui.css' 'src/jquery-ui.min.js' 'tmp_b64/bg.png.tid' 'tmp_b64/delete.png.tid' 'tmp_b64/saveTiddler.png.tid' \
		'tmp_b64/cancel.png.tid' 'build/HtmlCss' 'src/HtmlJavascript.tid' 'src/htmljs-takenoteedit.js' \
		'src/bubble.js' \
		'src/require.js' 'tmp_b64/icon-search.png.tid' 'tmp_b64/icon-incomplete.png.tid' 'tmp_b64/icon-recent.png.tid' \
		'src/dashboard'  'src/chrjs.js' 'tmp_b64/touchicon.png.tid' 'src/manifest.mf'
