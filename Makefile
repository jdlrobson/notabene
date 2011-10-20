clean: cleanlocal cleanremote

cleanlocal: cleanmeta
	rm -rf build tmp tmp_b64

cleanremote:
	rm -rf src/chrjs.js src/chrjs-store.js src/jquery.min.js src/jquery-json.min.js src/bubble.js 

remotes: clean
	curl -o src/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/master/dist/chrjs-store-latest.js
	curl -o src/jquery.min.js \
		http://code.jquery.com/jquery-1.6.1.min.js
	curl -o src/jquery-json.min.js \
		http://jquery-json.googlecode.com/files/jquery.json-2.2.min.js
	curl -o src/bubble.js \
		http://mobile-bookmark-bubble.googlecode.com/hg/bookmark_bubble.js

devlocal: remotes
	echo "open http://0.0.0.0:8080/static/edit.html"
	twanager bag test_public < bag.json
	echo "\n\nrun twanager server && open http://0.0.0.0:8080/static/edit.html\n\n"

compress:
	java -jar yuicompressor-2.4.6.jar src/notabene.js -o build/notabene.js
	java -jar yuicompressor-2.4.6.jar src/notabene.css -o build/notabene.css

cleanmeta:
	rm -f src/notabene.js.meta
	rm -f src/htmljs-takenoteedit.js.meta
	rm -f build/notabene.js.meta
	rm -f build/notabene.css.meta
	rm -f src/notabene.css.meta
	rm -f src/dashboard.meta
	rm -f src/takenote.meta
	rm -f src/takenote_manifest.appcache.meta

meta:
	rm -rf build
	mkdir build
	cp src/javascript.meta src/notabene.js.meta
	cp src/javascript.meta src/htmljs-takenoteedit.js.meta
	cp src/javascript.meta build/notabene.js.meta
	cp src/css.meta build/notabene.css.meta
	cp src/css.meta src/notabene.css.meta
	cp src/html.meta src/takenote.meta
	cp src/html.meta src/dashboard.meta
	cat src/css.meta src/notabene.css > build/notabene.css.tid
	cat src/html.meta src/takenote > build/takenote.tid
	cat src/html.meta src/dashboard > build/dashboard.tid
	cat src/manifest.meta src/takenote_manifest.appcache > build/takenote_manifest.appcache.tid

dev: meta
	./upload.sh takenotedev 'src/notabene.js' 'src/notabene.css' \
		'src/HtmlJavascript.tid' 'src/htmljs-takenoteedit.js' \
		'dist/touchicon_takenote.png.tid' \
		'src/dashboard' 'src/takenote'

release: meta compress
	rm -rf dist/latest
	cd dist && mkdir latest && cd latest && \
		cp ../common.recipe . && \
		cp ../tiddlyspace.recipe . && \
		cp ../../src/htmljs-takenoteedit.js.meta htmljs-takenoteedit.js.js.meta && \
		cp ../../src/htmljs-takenoteedit.js htmljs-takenoteedit.js.js && \
		cp ../../src/HtmlJavascript.tid . && \
		cp ../../build/notabene.js notabene.js.js && cp ../../src/notabene.js.meta notabene.js.js.meta && \
		cp ../../build/notabene.css.tid . && \
		cp ../../build/dashboard.tid . && cp ../../build/takenote.tid . && \
		cp ../../build/takenote_manifest.appcache.tid .

@takenote: meta compress
	./upload.sh takenote 'build/notabene.js' 'build/notabene.css' \
		'build/takenote.tid' 'build/dashboard.tid' 'src/takenote_manifest.appcache' \
		'dist/touchicon_takenote.png.tid' \
		'src/HtmlJavascript.tid' 'src/htmljs-takenoteedit.js' \
