clean:
	rm -R src/lib

remotes:
	mkdir -p src/lib
	curl -o src/lib/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/lib/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/master/chrjs-store.js
	curl -o src/lib/jquery.min.js \
		http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.js
	curl -o src/lib/jquery-json.min.js \
		http://jquery-json.googlecode.com/files/jquery.json-2.2.min.js

dev: remotes
	twanager server && twanager bag test_public && open "http://0.0.0.0:8080/static/edit.html"
dist: dev
	./upload.sh takenote 'src/notabene.js' 'src/notabene.css' 'src/lib/chrjs-store.js' 'src/lib/chrjs.js'
