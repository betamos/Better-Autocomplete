Better Autocomplete jQuery plugin
=================================

This jQuery plugin can be attached to text input fields for autocompletion,
using mouse and keyboard for selection. It can handle either a local source
*(e.g. an array of objects)* or a remote resource *(e.g. by polling an AJAX
path which delivers JSON/XML data asynchronously)*.

Requirements
------------

 * jQuery 1.4+
 * A modern web browser *or* Internet Explorer 7+

The state of this project
-------------------------

This plugin is as good as ready in many ways and is developed over a couple of
months, so the codebase is solid and tested in multiple environments. This
project will enter RC stage as soon as all critical IE bugs have been fixed.

Demo and docs
-------------

Try the [demonstration](http://betamos.se/better-autocomplete/demo/index.html)
and browse the
[documentation](http://betamos.se/better-autocomplete/docs/index.html).

Customizing
-----------

The most powerful ability of this plugin, compared to others, is that it is
very flexible. There are settings and callbacks for almost every aspect of the
plugin. The callbacks can be overridden easily by you to customize the
behavior. See the docs for details.

If there is one callback that will do you more good than anyone else, it is the
[select callback](http://betamos.se/better-autocomplete/docs/symbols/callbacks.html#select).
In the demo, there are sample implementations of it. Check the source code.

Author and license
------------------

[Better Autocomplete](http://github.com/betamos/Better-Autocomplete),
Copyright 2011, [Didrik Nordström](http://betamos.se)

Dual licensed under the MIT or GPL Version 2 licenses.
