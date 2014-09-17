SRC=content.js icon.png yunosi.js yunosi.html manifest.json

all: test yunosi.zip

test:
	grunt qunit

yunosi.zip: ${SRC}
	zip yunosi.zip ${SRC}
