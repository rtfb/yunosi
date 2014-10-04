SRC=background.js \
	content.js \
	icon.png \
	yunosi.js \
	yunosi.html \
	yunosi.css \
	manifest.json

.PHONY: all

all: yunosi.zip

node_modules/qunitjs:
	npm install

yunosi.zip: node_modules/qunitjs ${SRC}
	grunt
	zip yunosi.zip ${SRC}
