#!/bin/bash

# Generate documenation to the docs folder
jsrun.sh -d=docs src/

# Flush build directory
rm -Rf build
mkdir build

# Copy CSS from src to build
cp src/better-autocomplete.css build/

# Generate minified JS using Closure Compiler
IN=src/jquery.better-autocomplete.js
OUT=build/jquery.better-autocomplete.min.js

curl -s \
        -d compilation_level=SIMPLE_OPTIMIZATIONS \
        -d output_format=text \
        -d output_info=compiled_code \
        --data-urlencode "js_code@${IN}" \
        http://closure-compiler.appspot.com/compile \
        > $OUT

