clean:
	rm -R src/lib

dev:
	mkdir -p src/lib
	curl -o src/lib/chrjs.js \
		https://raw.github.com/tiddlyweb/chrjs/master/main.js
	curl -o src/lib/chrjs-store.js \
		https://raw.github.com/bengillies/chrjs.store/master/chrjs-store.js
	curl -o src/lib/jquery.min.js \
		http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.js


