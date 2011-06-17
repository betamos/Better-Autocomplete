/**
 * Better Autocomplete jQuery plugin.
 * Create or alter an autocomplete object instance to every text input
 * element in the selection.
 *
 * @author Didrik Nordström, http://betamos.se/
 *
 * @requires
 *   <ul><li>
 *   jQuery 1.4+
 *   </li><li>
 *   a modern web browser (not tested in IE)
 *   </li></ul>
 *
 * @constructor
 *
 * @name jQuery.betterAutocomplete
 *
 * @param {String} method
 *   Should be one of the following:
 *   <ul><li>
 *     init: Initiate Better Autocomplete instances on the text input elements
 *     in the current jQuery selection. They are enabled by default. The other
 *     parameters are then required.
 *   </li><li>
 *     enable: In this jQuery selection, reenable the Better Autocomplete
 *     instances.
 *   </li><li>
 *     disable: In this jQuery selection, disable the Better Autocomplete
 *     instances.
 *   </li><li>
 *     destroy: In this jQuery selection, destroy the Better Autocomplete
 *     instances. It will not be possible to reenable them after this.
 *   </li></ul>
 *
 * @param {String|Object} [resource]
 *   If String, it will become the path for a remote resource. If not, it will
 *   be treated like a local resource. The path should provide JSON objects
 *   upon HTTP requests.
 *
 * @param {Object} [options]
 *   An object with configurable options:
 *   <ul><li>
 *     charLimit: (default=3) The minimum number of chars to do an AJAX call.
 *     A typical use case for this limit is to reduce server load.
 *   </li><li>
 *     delay: (default=250) The time in ms between last keypress and AJAX call.
 *   </li><li>
 *     maxHeight: (default=330) The maximum height in pixels for the
 *     autocomplete list.
 *   </li><li>
 *     remoteTimeout: (default=5000) The timeout for remote (AJAX) calls.
 *   </li><li>
 *     selectKeys: (default=[9, 13]) The key codes for keys which will select
 *     the current highlighted element. The defaults are tab, enter.
 *   </li></ul>
 *
 * @param {Object} [callbacks]
 *   An object containing optional callback functions on certain events. See
 *   {@link callbacks} for details. These callbacks should be used when
 *   customization of the default behavior of Better Autocomplete is required.
 *
 * @returns {Object}
 *   The jQuery object with the same element selection, for chaining.
 */

(function ($) {

$.fn.betterAutocomplete = function(method) {

  /*
   * Each method expects the "this" object to be a valid DOM text input node.
   * The methods "enable", "disable" and "destroy" expects an instance of a
   * BetterAutocomplete object as their first argument.
   */
  var methods = {
    init: function(resource, options, callbacks) {
      var $input = $(this),
        bac = new BetterAutocomplete($input, resource, options, callbacks);
      $input.data('better-autocomplete', bac);
      bac.enable();
    },
    enable: function(bac) {
      bac.enable();
    },
    disable: function(bac) {
      bac.disable();
    },
    destroy: function(bac) {
      bac.destroy();
    }
  };

  var args = Array.prototype.slice.call(arguments, 1);

  // Method calling logic
  this.filter(':input[type=text]').each(function() {
    switch (method) {
    case 'init':
      methods[method].apply(this, args);
      break;
    case 'enable':
    case 'disable':
    case 'destroy':
      var bac = $(this).data('better-autocomplete');
      if (bac instanceof BetterAutocomplete) {
        methods[method].call(this, bac);
      }
      break;
    default:
      $.error('Method ' +  method + ' does not exist in jQuery.betterAutocomplete.');
    }
  });

  // Maintain chainability
  return this;
};

/**
 * The BetterAutocomplete constructor function. Returns a BetterAutocomplete
 * instance object.
 *
 * @private @constructor
 * @name BetterAutocomplete
 *
 * @param $input
 *   A single input element wrapped in jQuery
 */
var BetterAutocomplete = function($input, resource, options, callbacks) {

  options = $.extend({
    charLimit: 3,
    delay: 250, // milliseconds
    maxHeight: 330, // px
    remoteTimeout: 5000, // milliseconds
    selectKeys: [9, 13] // [tab, enter]
  }, options);

  /**
   * @name callbacks
   * @namespace
   */
  callbacks = $.extend(
  /**
   * @lends callbacks.prototype
   */
  {

    /**
     * Gets fired when the user selects a result by clicking or using the
     * keyboard to select an element.
     *
     * @param {Result} result
     *   The result object that was selected.
     */
    select: function(result) {
      $input.blur();
    },

    /**
     * Given a result object, render it to HTML. This callback can be viewed as
     * a theming function.
     *
     * @param {Object} result
     *   The result object that should be rendered.
     *
     * @returns {String} HTML output, will be wrapped in a list element.
     */
    renderResult: function(result) {
      var output = '';
      if (typeof result.title != 'undefined') {
        output += '<h4>' + result.title + '</h4>';
      }
      if (typeof result.description != 'undefined') {
        output += '<p>' + result.description + '</p>';
      }
      return output;
    },

    /**
     * Retrieve local results from the local resource by providing a search
     * term.
     *
     * @param {String} search
     *   The search term, unescaped. May contain any UTF-8 character.
     *
     * @param {Object} resource
     *   The resource provided in the {@link jQuery.betterAutocomplete} init
     *   constructor.
     */
    getLocalResults: function(search, resource) {
      if (!(resource instanceof Array)) {
        // Per default Better Autocomplete only handles arrays of data
        return;
      }
      search = search.toLowerCase();
      var results = [];
      $.each(resource, function(i, value) {
        switch (typeof value) {
        case 'string': // Flat array of strings
          if (value.toLowerCase().indexOf(search) >= 0) {
            // Match found
            results.push({ title: value });
          }
          break;
        case 'object': // Array of result objects
          if (typeof value.title != 'undefined' && value.title.toLowerCase().indexOf(search) >= 0) {
            // Match found in title field
            results.push(value);
          }
          break;
        }
      });
      return results;
    },

    /**
     * Fetch remote result data and return it using completeCallback when
     * fetching is finished. Must be asynchronous in order to not freeze the
     * Better Autocomplete instance.
     *
     * @param {String} url
     *   The URL to fetch data from.
     *
     * @param {Function} completeCallback
     *   This function must be called, even if an error occurs. It takes zero
     *   or one parameter: the data that was fetched.
     *
     * @param {Number} timeout
     *   The preferred timeout for the request. This callback should respect
     *   the timeout.
     */
    fetchRemoteData: function(url, completeCallback, timeout) {
      $.ajax({
        url: url,
        dataType: 'json',
        timeout: timeout,
        success: function(data, textStatus) {
          completeCallback(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          completeCallback();
        }
      });
    },

    /**
     * Process remote fetched data by extracting an array of result objects
     * from it.
     *
     * @param {mixed} data
     *   The raw data recieved from the server.
     *
     * @returns {Array}
     *   A flat array containing result objects.
     */
    processRemoteData: function(data) {
      return data;
    },

    /**
     * Called when remote fetching begins.
     */
    beginFetching: function() {
      $input.addClass('fetching');
    },

    /**
     * Called when fetching is finished. All active requests must finish before
     * this function is called.
     */
    finishFetching: function() {
      $input.removeClass('fetching');
    },

    /**
     * Construct the remote fetching URL.
     *
     * @param {String} path
     *   The path given in the {@link jQuery.betterAutocomplete} constructor.
     *
     * @param {String} search
     *   The raw search string. Remember to URL encode this to prevent illegal
     *   character errors.
     *
     * @returns {String}
     *   The URL, ready for fetching.
     */
    constructURL: function(path, search) {
      return path + '?s=' + encodeURIComponent(search);
    }
  }, callbacks);

  var self = this,
    lastRenderedSearch = '',
    results = {}, // Caching dababase of search results.
    userString = $input.val(), // Current input string,
    timer, // Used for options.delay
    activeSearchCount = 0,
    disableMouseHighlight = false,
    inputEvents = {},
    isLocal = (typeof resource != 'string');

  var $wrapper = $('<div />')
    .addClass('better-autocomplete')
    .insertAfter($input);

  var $resultsList = $('<ul />')
    .addClass('results')
    .width($input.outerWidth() - 2) // Subtract border width.
    .css('max-height', options.maxHeight + 'px')
    .appendTo($wrapper);

  inputEvents.focus = function() {
    // Parse results to be sure, the input value may have changed
    parseResults();
    $wrapper.show();
  };

  inputEvents.blur = function() {
    $wrapper.hide();
  },

  inputEvents.keydown = function(event) {
    var index;
    // If an arrow key is pressed and a result is highlighted
    if ([38, 40].indexOf(event.keyCode) >= 0 && (index = getHighlighted()) >= 0) {
      var newIndex,
        size = $('.result', $resultsList).length;
      switch (event.keyCode) {
      case 38: // Up arrow
        newIndex = Math.max(0, index-1);
        break;
      case 40: // Down arrow
        newIndex = Math.min(size-1, index+1);
        break;
      }
      // Index have changed so update highlighted element, then cancel the event.
      if (typeof newIndex == 'number') {

        // Disable the auto-triggered mouseover event
        disableMouseHighlight = true;

        setHighlighted(newIndex);

        // Automatic scrolling to the highlighted result
        var $scrollTo = $('.result', $resultsList).eq(getHighlighted());

        // Scrolling up, then show the group title
        if ($scrollTo.prev().is('.group') && event.keyCode == 38) {
          $scrollTo = $scrollTo.prev();
        }
        // Is the result above the visible region?
        if ($scrollTo.position().top < 0) {
          $resultsList.scrollTop($scrollTo.position().top + $resultsList.scrollTop());
        }
        // Or is it below the visible region?
        else if (($scrollTo.position().top + $scrollTo.outerHeight()) > $resultsList.height()) {
          $resultsList.scrollTop($scrollTo.position().top + $resultsList.scrollTop() + $scrollTo.outerHeight() - $resultsList.height());
        }
        return false;
      }
    }
    else if (options.selectKeys.indexOf(event.keyCode) >= 0) {
      // Only hijack the event if selecting is possible or pending action.
      if (select() || activeSearchCount >= 1 || timer !== null) {
        return false;
      }
      else {
        return true;
      }
    }
  };

  inputEvents.keyup = function() {
    clearTimeout(timer);
    // Indicate that timer is inactive
    timer = null;
    // Parse always!
    parseResults();
    // If the results can't be displayed we must fetch them, then display
    if (needsFetching()) {
      $resultsList.empty();
      if (isLocal) {
        fetchResults($input.val());
      }
      else {
        timer = setTimeout(function() {
          fetchResults($input.val());
          timer = null;
        }, options.delay);
      }
    }
  };

  $('.result', $resultsList[0]).live({
    // When the user hovers a result with the mouse, highlight it.
    mouseover: function() {
      if (disableMouseHighlight) {
        return;
      }
      setHighlighted($(this).data('index'));
    },
    mousemove: function() {
      // Enable mouseover again.
      disableMouseHighlight = false;
    },
    mousedown: function() {
      select();
      return false;
    }
  });

  // Prevent blur when clicking on group titles, scrollbars etc.,
  // This event is triggered after the others' because of bubbling order.
  $resultsList.mousedown(function() {
    return false;
  });

  /*
   * PUBLIC METHODS
   */

  /**
   * Enable this instance.
   */
  this.enable = function() {
    // Turn off the browser's autocompletion
    $input
      .attr('autocomplete', 'OFF')
      .attr('aria-autocomplete', 'none');
    $input.bind(inputEvents);
  };

  /**
   * Disable this instance.
   */
  this.disable = function() {
    $input
      .removeAttr('autocomplete')
      .removeAttr('aria-autocomplete');
    $wrapper.hide();
    $input.unbind(inputEvents);
  };

  /**
   * Disable and remove this instance. This instance should not be reused.
   */
  this.destroy = function() {
    $wrapper.remove();
    $input.unbind(inputEvents);
    $input.removeData('better-autocomplete');
  };

  /*
   * PRIVATE METHODS
   */

  /**
   * Set highlight to a specific result item
   *
   * @param index
   *   The result's index, starting on 0
   */
  var setHighlighted = function(index) {
    $('.result', $resultsList)
      .removeClass('highlight')
      .eq(index).addClass('highlight');
  };

  /**
   * Retrieve the index of the currently highlighted result item
   *
   * @return
   *   The result's index or -1 if no result is highlighted
   */
  var getHighlighted = function() {
    return $('.result', $resultsList).index($('.result.highlight', $resultsList));
  };

  /**
   * Select the current highlighted element
   *
   * @return
   *   True if a selection was possible
   */
  var select = function() {
    var $result = $('.result', $resultsList).eq(getHighlighted());
    if ($result.length == 0) {
      return false;
    }
    var result = $result.data('result');

    callbacks.select(result);

    // Parse once more, if the callback changed focus or content
    parseResults();
    return true;
  };

  /**
   * Fetch results asynchronously via AJAX.
   * Errors are ignored.
   *
   * @param search
   *   The search string
   */
  var fetchResults = function(search) {
    // Synchronously fetch local data
    if (isLocal) {
      results[search] = callbacks.getLocalResults(search, resource);
      parseResults();
    }
    else {
      activeSearchCount++;
      var url = callbacks.constructURL(resource, search);
      callbacks.beginFetching();
      callbacks.fetchRemoteData(url, function(data) {
        var searchResults = callbacks.processRemoteData(data);
        if (typeof searchResults == 'undefined' || !(searchResults instanceof Array)) {
          searchResults = [];
        }
        results[search] = searchResults;
        activeSearchCount--;
        if (activeSearchCount == 0) {
          callbacks.finishFetching();
        }
        parseResults();
      }, options.remoteTimeout);
    }
  };

  /**
   * Does the current user string need fetching?
   * Checks character limit and cache.
   *
   * @returns {Boolean} true if fetching is required
   */
  var needsFetching = function() {
    var userString = $input.val();

    if (userString.length < options.charLimit) {
      return false;
    }
    else if (typeof results[userString] != 'undefined') {
      return false;
    }
    else {
      return true;
    }
  };

  /**
   * Checks if needed to re-render etc
   */
  var parseResults = function() {
    // TODO: Logical statements here, cleanup?
    if (!$input.is(':focus')) {
      $wrapper.hide();
      return;
    }
    // Check if already rendered
    if (lastRenderedSearch == $input.val()) {
      $wrapper.show();
      return;
    }
    $wrapper.hide();
    if (needsFetching()) {
      return;
    }
    lastRenderedSearch = $input.val();

    if (renderResults()) {
      setHighlighted(0);
      $wrapper.show();
    }
  };

  /**
   * Generate DOM result items from the current search using the results cache
   * 
   * @todo Grouping of items even if they are recieved in an arbitrary order?
   *
   * @todo Sanitization of title/description? Something that just filters XSS
   * would be necessary, I think. Maybe a list of allowed HTML tags.
   * Another option is to inform the developers that they should sanitize
   * server-side.
   */
  var renderResults = function() {

    // Update user string
    userString = $input.val();

    $resultsList.empty();

    // The result is not in cache, so there is nothing to display right now
    if (!(results[userString] instanceof Array)) {
      return false;
    }
    var lastGroup, output, count = 0;
    $.each(results[userString], function(index, result) {
      if (!(result instanceof Object)) {
        return;
      }

      // Grouping
      if (typeof result.group != 'undefined' && result.group !== lastGroup) {
        var $groupHeading = $('<li />').addClass('group')
          .append('<h3>' + result.group + '</h3>')
          .appendTo($resultsList);
      }
      lastGroup = result.group;

      if (output = callbacks.renderResult(result)) {
        $('<li />').addClass('result')
          .append(output)
          .data('result', result) // Store the result object on this DOM element
          .data('index', index) // For quick determination of index on events
          .addClass(result.addClass)
          .appendTo($resultsList);
      }
      count++;
    });
    return !!count; // Only true if there were elements
  };
};

/*
 * jQuery focus selector, required by Better Autocomplete.
 *
 * @see http://stackoverflow.com/questions/967096/using-jquery-to-test-if-an-input-has-focus/2684561#2684561
 */
var filters = $.expr[':'];
if (!filters.focus) {
  filters.focus = function(elem) {
    return elem === document.activeElement && (elem.type || elem.href);
  };
}

})(jQuery);
