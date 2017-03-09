/*!
 * Suggest jQuery plugin
 *
 * Copyright (c) 2012 Florian Plank (http://www.polarblau.com/)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * USAGE:
 *
 * $('#container').suggest(haystack, {
 *   suggestionColor   : '#cccccc',
 *   moreIndicatorClass: 'suggest-more',
 *   moreIndicatorText : '&hellip;'
 * });
 *
 */

(function($) {

	$.fn.suggest = function(source, options) {

		var settings = $.extend({
			suggestionColor       : '#ccc',
			moreIndicatorClass    : 'suggest-more',
			moreIndicatorText     : '&hellip;'
		}, options);

		return this.each(function() {

			$this = $(this);

			// this helper will show possible suggestions
			// and needs to match the input field in style
			var $suggest = $('<div/>', {
				'css' : {
					'position'        : 'absolute',
					'height'          : $this.height(),
					'width'           : $this.width(),
					'top'             : $this.css('borderTopWidth'),
					'left'            : $this.css('borderLeftWidth'),
					'padding'         : $this.cssShortForAllSides('padding'),
					'margin'          : $this.cssShortForAllSides('margin'),
					'fontFamily'      : $this.css('fontFamily'),
					'fontSize'        : $this.css('fontSize'),
					'fontStyle'       : $this.css('fontStyle'),
					'lineHeight'      : $this.css('lineHeight'),
					'fontWeight'      : $this.css('fontWeight'),
					'letterSpacing'   : $this.css('letterSpacing'),
					'backgroundColor' : $this.css('backgroundColor'),
					'color'           : settings.suggestionColor
				}
			});

			var $more = $('<span/>', {
				'css' : {
					'position'        : 'absolute',
					'top'             : $suggest.height() + parseInt($this.css('fontSize'), 10) / 2,
					'left'            : $suggest.width(),
					'display'         : 'block',
					'fontSize'        : $this.css('fontSize'),
					'fontFamily'      : $this.css('fontFamily'),
					'color'           : settings.suggestionColor
				},
				'class'             : settings.moreIndicatorClass
			})
			.html(settings.moreIndicatorText)
			.hide();


			// dansel mods
			var $list = $('.suggest-list');
			var actions = $list.clone();


			$this
				.attr({
					'autocomplete'    : "off",
					'spellcheck'      : "false",
					'dir'             : "ltr"
				})
				// by setting the background to transparent, we will
				// be able to "see through" to the suggestion helper
				.css({
					'background'      : 'transparent'
				})
				.wrap($('<div/>', {
					'css': {
						'position'      : 'relative',
						'paddingBottom' : '1em'
					}
				}))

				.bind('keydown.suggest', function(e){
					var code = (e.keyCode ? e.keyCode : e.which);

					// the tab key will force the focus to the next input
					// already on keydown, let's prevent that
					// unless the alt key is pressed for convenience
					if (code == 9 && !e.altKey) {
						e.preventDefault();

					// let's prevent default enter behavior while a suggestion
					// is being accepted (e.g. while submitting a form)
					} else if (code == 13) {
						if (!$suggest.is(':empty')) {
							e.preventDefault();
						}

					// use arrow keys to cycle through suggestions
					} else if (code == 38 || code == 40) {
						e.preventDefault();
						var suggestions = $(this).data('suggestions');

						if (suggestions.all.length > 1) {
							// arrow down:
							if (code == 40 && suggestions.index < suggestions.all.length - 1) {
								suggestions.suggest.html(suggestions.all[++suggestions.index]);
								$list.find('li:nth-child('+ (suggestions.index + 1) + ')').addClass('highlight');
								$list.find('li:nth-child('+ (suggestions.index) + ')').removeClass('highlight');
							// arrow up:
							} else if (code == 38 && suggestions.index > 0) {
								suggestions.suggest.html(suggestions.all[--suggestions.index]);
								$list.find('li:nth-child('+ (suggestions.index + 1) + ')').addClass('highlight');
								$list.find('li:nth-child('+ (suggestions.index + 2) + ')').removeClass('highlight');
							}
							$(this).data('suggestions').index = suggestions.index;
						}
					}
				})

				.bind('keyup.suggest', function(e) {
					var code = (e.keyCode ? e.keyCode : e.which);

					// Have the arrow keys been pressed?
					if (code == 38 || code == 40) {
						return false;
					}

					// be default we hide the "more suggestions" indicator
					$more.hide();

					// what has been input?
					var needle = $(this).val();

					// convert spaces to make them visible
					var needleWithWhiteSpace = needle.replace(' ', '&nbsp;');

					// accept suggestion with 'enter' or 'tab'
					// if the suggestion hasn't been accepted yet
					if (code == 9 || code == 13) {
						// only accept if there's anything suggested
						if ($suggest.text().length > 0) {
							e.preventDefault();
							var suggestions = $(this).data('suggestions');
							$(this).val(suggestions.terms[suggestions.index]);
							// clean the suggestion for the looks
							$suggest.empty();
							return false;
						}
					}

					// make sure the helper is empty
					$suggest.empty();

					// if nothing has been input, leave it with that
					if (!$.trim(needle).length) {
						$list.html('').append(actions);
						return false;
					}

					// see if anything in source matches the input
					// by escaping the input' string for use with regex
					// we allow to search for terms containing specials chars as well
					var regex = new RegExp('^' + needle.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
					var suggestions = [], terms = [], recArr = [];
					for (var i = 0, l = source; i < l.length; i++) {
						if (regex.test(l[i])) {
							var term = l[i].split('#'[0]);
							terms.push(term[0]);
							suggestions.push(needleWithWhiteSpace + term[0].slice(needle.length));

							var rec = {
								'term' : term[0],
								'type' : term[1]
							}
							recArr.push(rec);
						}
					}

					if (suggestions.length > 0) {
						// if there's any suggestions found, use the first
						// don't show the suggestion if it's identical with the current input
						if (suggestions[0] !== needle) {
							$suggest.html(suggestions[0]);
						}

						// dansel mods
						// add type to each by scraping off hashtag from results


						// store found suggestions in data for use with arrow keys
						$(this).data('suggestions', {
							'all'    : suggestions,
							'terms'  : terms,
							'index'  : 0,
							'suggest': $suggest
						});

						// dansel mods
						$list.html('');
						var recs = recArr.slice(0, 10);

						$.each(recs, function(i, rec){
							var hotkey = '&#8997;' + i;
							if(i === 0){
								hotkey = '&#9166;';
							}
							if(rec.term.length > 40){
								$list.append('<li class="'+ ((i === 0) ? 'highlight ' : '') + rec.type +'"><a href="#"><small>' + rec.type + '</small>' + rec.term.substring(0, Math.min(40,rec.term.length)) + '... <span>' + hotkey +'</span></a></li>');
							}
							else{
								$list.append('<li class="'+ ((i === 0) ? 'highlight ' : '') + rec.type +'"><a href="#"><small>' + rec.type + '</small>' + rec.term + ' <span>' + hotkey + '</span></a></li>');
							}
						});

						// show the indicator that there's more suggestions available
						// only for more than one suggestion
						if (suggestions.length > 1) {
							$more.show();
						}
					}
				})

				// clear suggestion on blur
				.bind('blur.suggest', function(){
					$suggest.empty();
					$list.html('').append(actions);
				});

				// insert the suggestion helpers within the wrapper
				$suggest.insertAfter($this);
				$more.insertAfter($suggest);

		});

	};

	/* A little helper to calculate the sum of different
	 * CSS properties around all four sides
	 *
	 * EXAMPLE:
	 * $('#my-div').cssSum('padding');
	 */
	$.fn.cssShortForAllSides = function(property) {
		var $self = $(this), sum = [];
		var properties = $.map(['Top', 'Right', 'Bottom', 'Left'], function(side){
			return property + side;
		});
		$.each(properties, function(i, e) {
			sum.push($self.css(e) || "0");
		});
		return sum.join(' ');
	};
})(jQuery);
