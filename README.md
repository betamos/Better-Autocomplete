Better Autocomplete jQuery plugin
=================================

This jQuery plugin can be attached to text input fields for autocompletion,
using mouse and keyboard for selection. It can handle either a local source
*(e.g. an array of objects)* or a remote resource *(e.g. by polling an AJAX
path which delivers JSON/XML data asynchronously)*.

Requirements
------------

 * jQuery 1.4+
 * A modern desktop web browser *or* Internet Explorer 7+

*Actually, Better Autocomplete probably works fine for many mobile device web browsers
as well, but for now they are not supported.*

Demo and documentation
----------------------

Try the [demonstration](http://betamos.se/better-autocomplete/demo/index.html)
and browse the
[documentation](http://betamos.se/better-autocomplete/docs/index.html).

Customizing
-----------

The most powerful ability of this plugin, compared to others, is that it is
very flexible. There are settings and callbacks for almost every aspect of the
plugin. The callbacks can be overridden easily by you to customize the
behavior. Read documentation for details.

If there is one callback that will do you more good than anyone else, it is the
[select callback](http://betamos.se/better-autocomplete/docs/symbols/callbacks.html#select).
For sample implementations, check demo directory.

Building instructions
---------------------

It works perfectly fine to use the contents of the `src` directory as is,
but it is also possible to generate a minified version of the JavaScript file
(using [Google Closure Compiler](http://code.google.com/closure/compiler/)).

Just run `make` from the command line to generate minified JS (you need curl
and an internet connection). Then check out the `build` directory.

To generate documentation you need to download and configure
[JsDoc Toolkit](http://code.google.com/p/jsdoc-toolkit/) so that you have
`jsrun.sh` in your `PATH`. Then run `make html` from the command line.

Author and license
------------------

[Better Autocomplete](http://github.com/betamos/Better-Autocomplete),
Copyright 2011, [Didrik Nordström](http://betamos.se)

Dual licensed under the MIT or GPL Version 2 licenses.
