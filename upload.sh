#!/bin/sh

# The original script was written by psd and can be found here - https://gist.github.com/604709
# cheap and cheerful pushing of files to TiddlySpace, 
# authorization taken from the variable TIDDLYSPACE_AUTH which for me is:
# export TIDDLYSPACE_AUTH='-u myuser:mypass'

# usage: sts spacename file1 file2 ..
space="$1" ; shift

#  public/private
pp=public

for file in "$@"
do
	tiddler=$(basename "$file")
	case "$file" in
	*/HtmlCss)
		content="text/css"
		;;
	*.tid)
		content="text/plain"
		tiddler=$(basename "$file" .tid)
		;;
	*.appcache)
		content="text/cache-manifest"
		;;
	*.mf)
		content="text/cache-manifest"
		;;
	*.html)
		content="text/html;charset=utf-8"
		tiddler=$(basename "$file" .html)
		;;
	*.svg)
		content="image/svg+xml"
		;;
	*.css)
		content="text/css"
		;;
	*.pdf)
		content="application/pdf"
		;;
	*.mov)
		content="video/quicktime"
		;;
	*.ogg)
		content="application/ogg"
		;;
	*.png)
		content="image/png"
		#tiddler=SiteIcon
		;;
	*.gif)
		content="image/gif"
		;;
	*.jpg)
		content="image/jpeg"
		;;
	*.js)
		content="text/javascript"
		;;
	*)
		content="text/html"
		;;
	esac
	if [ -r $file.meta ]
	then
		content="text/plain"
		o="$file"
		meta="$o.meta"
		file="/tmp/sts.tid"
		(
			cat $o.meta
			echo 
			cat $o 
		)> $file
		tiddler=$(basename "$o")
	fi
	set -x
	curl -X PUT $TIDDLYSPACE_AUTH http://${space}.tiddlyspace.com/bags/${space}_$pp/tiddlers/$tiddler --data-binary @$file -H "Content-type: $content"
	set +x
done