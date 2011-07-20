clean:
	rm -rf src/chrjs.js src/chrjs-store.js src/jquery.min.js src/jquery-json.min.js src/bg.png

remotes: clean
	curl -o src/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/99f0e7ff2bcc514d01f9c524915b936fcbfe294f/dist/chrjs-store-0.2.4.min.js
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

dev:
	./upload.sh takenotedev 'src/notabene.js' 'src/notabene.css' 'src/chrjs-store.js' 'src/chrjs.js' 'src/touchicon.png' \
		'src/jquery-ui.css' 'src/jquery-ui.min.js' 'src/bg.png' \
		'src/require.js' \
		'src/dashboard' 'src/takenote' 'src/jquery.min.js'

dist:
	./upload.sh takenote 'src/notabene.js' 'src/notabene.css' 'src/chrjs-store.js' \
		'src/jquery-json.min.js' 'src/jquery.min.js' 'src/takenote' \
		'src/jquery-ui.css' 'src/jquery-ui.min.js' 'src/bg.png' \
		'src/require.js' \
		'src/dashboard'  'src/chrjs.js' 'src/touchicon.png' 'src/manifest.mf'
