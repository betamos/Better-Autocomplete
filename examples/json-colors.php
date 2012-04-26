<?php
/**
 * @file Local server-side testing for Better Autocomplete.
 */

$colors = array();

$colors[] = array(
  'title' => 'Red',
  'description' => 'The color of the heart.',
  'group' => 'Ground colors' // Grouping
);

$colors[] = array('title' => 'Yellow');

$colors[] = array(
  'title' => 'Green',
  'description' => 'If you look at your plants, they will likely be green.',
  'group' => 'Ground colors',
);

$colors[] = array(
	'title' => 'Pink',
	'description' => 'For ponies, it is a <em>very common</em> hair color.'
);

$colors[] = array(
	'title' => 'Blue',
	'description' => 'Color of the sky and the ocean, what else can I say?',
	'group' => 'Ground colors'
);

$colors[] = array(
  'title' => 'Beer',
  'description' => 'I know, I know, it may not be a color, but who cares? ' +
               'This is a demonstration and I wan\'t to have a long text ' +
               'that wraps.'
);

$query = (string) $_GET['q'];
$results = array();

foreach ($colors as $color) {
  // Case-insensitive search on title
  if (preg_match('~' . preg_quote($query, '~') . '~i', $color['title'])) {
    $results[] = $color;
  }
}

header('Content-type: application/json');

print json_encode($results);
