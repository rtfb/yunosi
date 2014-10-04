SRC=background.js \
	content.js \
	icon.png \
	yunosi.js \
	yunosi.html \
	yunosi.css \
	manifest.json

all: test yunosi.zip

test: node_modules/qunitjs
	grunt qunit

node_modules/qunitjs:
	npm install

yunosi.zip: ${SRC}
	zip yunosi.zip ${SRC}
