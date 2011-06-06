clean:
	rm -R src/lib

dev:
	mkdir -p src/lib
	curl -o src/lib/jquery.min.js \
		http://ajax.googleapis.com/ajax/libs/jquery/1.4/jquery.js


