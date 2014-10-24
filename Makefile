SRC=background.js \
	content.js \
	icon.png \
	icon128.png \
	yunosi.js \
	yunosi.html \
	yunosi.css \
	manifest.json

.PHONY: all clean

all: yunosi.zip

node_modules/qunitjs:
	npm install

yunosi.zip: node_modules/qunitjs ${SRC}
	grunt
	zip yunosi.zip ${SRC}

clean:
	rm yunosi.zip
