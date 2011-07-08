clean:
	rm -rf src/chrjs.js src/chrjs-store.js src/jquery.min.js src/jquery-json.min.js

remotes: clean
	curl -o src/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/master/chrjs-store.js
	curl -o src/jquery.min.js \
		http://code.jquery.com/jquery-1.6.1.min.js
	curl -o src/jquery-json.min.js \
		http://jquery-json.googlecode.com/files/jquery.json-2.2.min.js

devlocal: remotes
	echo "open http://0.0.0.0:8080/static/edit.html"
	twanager bag test_public < bag.json
	echo "\n\nrun twanager server && open http://0.0.0.0:8080/static/edit.html\n\n"

dev: remotes
	./upload.sh takenotedev 'src/notabene.js' 'src/notabene.css' 'src/chrjs-store.js' 'src/chrjs.js' 'src/touchicon.png' \
		'src/takenote' 'src/jquery.min.js'

dist: remotes
	./upload.sh takenote 'src/notabene.js' 'src/notabene.css' 'src/chrjs-store.js' \
		'src/jquery-json.min.js' 'src/jquery.min.js' 'src/takenote' \
		'src/chrjs.js' 'src/touchicon.png' 'src/manifest.mf'
