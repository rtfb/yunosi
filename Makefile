TARGETS=\
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

yunosi.zip: node_modules/qunitjs $(addprefix build/, ${TARGETS})
	grunt
	grunt test_cover
	cd build && zip yunosi.zip *

build/%.js: %.js
	@mkdir -p build
	cp $< $@

build/%.png: %.png
	@mkdir -p build
	cp $< $@

build/yunosi.html: yunosi.html
	cp $< $@

build/yunosi.css: yunosi.css
	cp $< $@

build/manifest.json: manifest.json
	cp $< $@

clean:
	rm -r build
