
/**
 * Better Autocomplete
 * ===================
 *
 * Provides a jQuery plugin for fetching autocomplete results via
 * XMLHttpRequest from a JSON resource path.
 *
 * For usage, see below
 *
 * @author Didrik Nordström, http://betamos.se/
 *
 * Requirements:
 * - jQuery 1.4+
 * - A modern web browser
 */

(function ($) {

/**
 * Create an autocomplete object instance from a DOM input element by
 * providing a JSON path
 *
 * Example usage:
 * @code
 *   var bac = new BetterAutocomplete($('#find'), '/ajaxcall', {
 *     // Options
 *     getParam: 'keywords',
 *     remoteTimeout: 10000
 *   }, {
 *     // Callbacks
 *     select: function(result) {
 *       $('#title').val(result.title);
 *       $('#myoption').val(result.myOption);
 *     }
 *   });
 * @endcode
 *
 * The DOM tree will look like this:
 *
 * - input (text input field) Per default the input will have the class
 *   "fetching" while AJAX requests are made.
 * - div#linkit-autocomplete-wrapper (no width/height, position relative)
 *   - ul#linkit-autocomplete-results (fixed width, variable height)
 *     - li.result (variable height)
 *       - Customizable output.
 *     - li.result (more results...)
 *
 * Note that everything within li.result can be altered by the user,
 * @see callbacks.renderResult(). The default rendering function outputs:
 * - h4.title (contains the title)
 * - p.description (contains the description)
 * Note that no sanitization of title/description occurs client side.
 *
 * @param inputElement
 *   The text input element.
 *
 * @param path
 *   A path which provides JSON objects upon an HTTP request. This path should
 *   print a JSON-encoded array containing result objects. Each result object
 *   should contain these properties:
 *   - title: (optional) Per default, this will be rendered as an h4 tag in the
 *     list item. To alter, @see callbacks.renderResult().
 *   - description: (optional) Per default, this will be rendered as a p tag
 *     in the list item.
 *   - group: (optional) Add groups to the results. Will render nice group
 *     headings. Remember to put the results grouped together in the JSON
 *     array, otherwise they will be rendered as multiple groups.
 *   - addClass: (optional) Add CSS classes to the result object separated by
 *     spaces.
 *
 *   Feel free to add more properties. They will be returned with the callbacks
 *   just like the other properties.
 *
 * @param options
 *   An object with configurable options:
 *   - charLimit: (default=3) The minimum number of chars to do an AJAX call.
 *     A typical use case for this limit is to reduce server load.
 *   - delay: (default=250) The time in ms between last keypress and AJAX call.
 *   - getParam: (default="s") The get parameter for AJAX calls: "?param=".
 *   - remoteTimeout: (default=5000) Timeout on AJAX calls.
 *
 * @param callbacks
 *   An object containing optional callback functions on certain events:
 *   - select: Gets executed when a result gets selected (clicked) by the user.
 *     Arguments:
 *     - result: The result object that was selected.
 *   - renderResult: Gets executed when results has been fetched and needs to
 *     be rendered. It should return a DOM element, an HTML string, or a jQuery
 *     object which will be inserted into the list item. Arguments:
 *     - result: The result object that should be rendered.
 */
// TODO: Update documentation
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
 */
var BetterAutocomplete = function($input, resource, options, callbacks) {

  options = $.extend({
    charLimit: 3,
    delay: 250, // milliseconds
    maxHeight: 330, // px
    remoteTimeout: 5000, // milliseconds
    selectKeys: [9, 13], // [tab, enter]
    errorReporting: true, // Report AJAX errors using jQuery.error()
    local: (typeof resource != 'string') // A local resource
  }, options);

  callbacks = $.extend({
    select: function(result) {
      $input.blur();
    },
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
    // Local results, should return the results array synchronously
    fetchLocalResults: function(search, resource) {
      var results = [];
      if (resource instanceof Array) {
        // Escape search string to use in regex.
        search = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        $.each(resource, function(i, value) {
          if (typeof value != 'string') {
            return; // continue
          }
          // Match found
          if (new RegExp(search, 'i').test(value)) {
            results.push({ title: value });
          }
        });
      }
      return results;
    },
    // Remote results, should call completeCallback (even on error)
    // Must be asynchronous to not freeze BAC
    // Should respect the timeout
    fetchRemoteResults: function(url, completeCallback, timeout) {
      var xhr = $.ajax({
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
    beginFetching: function() {
      $input.addClass('fetching');
    },
    finishFetching: function() {
      $input.removeClass('fetching');
    },
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
    inputEvents = {};

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
      if (options.local) {
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
    if (options.local) {
      results[search] = callbacks.fetchLocalResults(search, resource);
      parseResults();
    }
    else {
      activeSearchCount++;
      var url = callbacks.constructURL(resource, search);
      callbacks.beginFetching();
      callbacks.fetchRemoteResults(url, function(searchResults) {
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
    // TODO: Change to $.each for consistency
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
