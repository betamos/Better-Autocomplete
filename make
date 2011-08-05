#!/bin/bash

# Generate documenation to the docs folder
jsdoc -d=docs src/

# Copy CSS from src to build
cp src/better-autocomplete.css build/

# Generate minified JS using Closure Compiler
IN=src/jquery.better-autocomplete.js
OUT=build/jquery.better-autocomplete.min.js
TEMP=build/closure-temp.js

curl -s \
        -d compilation_level=SIMPLE_OPTIMIZATIONS \
        -d output_format=text \
        -d output_info=compiled_code \
        --data-urlencode "js_code@${IN}" \
        http://closure-compiler.appspot.com/compile \
        > $TEMP

# Convert the minified JS file to UTF-8
iconv -f ISO-8859-1 -t UTF-8 $TEMP > $OUT
rm $TEMP
