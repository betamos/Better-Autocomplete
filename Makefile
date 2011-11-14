# GNU Makefile for Better Autocomplete

SRC = src
DOCS = docs
BUILD = build

all : $(BUILD)/ \
      $(BUILD)/jquery.better-autocomplete.min.js \
      $(BUILD)/better-autocomplete.css

$(BUILD)/:
	# Creating build directory…
	mkdir $(BUILD)

$(BUILD)/jquery.better-autocomplete.min.js : $(SRC)/jquery.better-autocomplete.js
	# Compressing JavaScript using Google Closure Compiler…
	curl -s \
	-d compilation_level=SIMPLE_OPTIMIZATIONS \
	-d output_format=text \
	-d output_info=compiled_code \
	--data-urlencode "js_code@$(SRC)/jquery.better-autocomplete.js" \
	http://closure-compiler.appspot.com/compile \
	> $(BUILD)/jquery.better-autocomplete.min.js

$(BUILD)/better-autocomplete.css : $(SRC)/better-autocomplete.css
	# Copying CSS…
	cp src/better-autocomplete.css $(BUILD)/

html : $(SRC)/
	# Generating documentation…
	jsrun.sh -d=$(DOCS) $(SRC)/

clean :
	# Removing generated directories…
	rm -Rf $(BUILD) $(DOCS)
