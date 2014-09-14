SRC=content.js icon.png yunosi.js yunosi.html manifest.json

all: yunosi.zip

yunosi.zip: ${SRC}
	zip yunosi.zip ${SRC}
