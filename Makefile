clean:
	rm -R src/lib

remotes:
	mkdir -p src/lib
	curl -o src/lib/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/lib/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/master/chrjs-store.js
	curl -o src/lib/jquery.min.js \
		http://code.jquery.com/jquery-1.6.1.min.js
	curl -o src/lib/jquery-json.min.js \
		http://jquery-json.googlecode.com/files/jquery.json-2.2.min.js

devlocal: remotes
	echo "open http://0.0.0.0:8080/static/edit.html"
	twanager bag test_public < bag.json
	echo "\n\nrun twanager server && open http://0.0.0.0:8080/static/edit.html\n\n"

dev: remotes
	./upload.sh takenotedev 'src/notabene.js' 'src/notabene.css' 'src/lib/chrjs-store.js' 'src/lib/chrjs.js' 'src/touchicon.png' \
		'src/lib/jquery.min.js'

dist: remotes
	./upload.sh takenote 'src/notabene.js' 'src/notabene.css' 'src/lib/chrjs-store.js' 'src/lib/chrjs.js' 'src/touchicon.png' \
		'src/lib/jquery.min.js'
