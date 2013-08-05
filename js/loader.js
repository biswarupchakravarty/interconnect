(function() {
	var stack = 0;
	window.loader = {
		show: function(message) {
			stack += 1;
			message = message || 'working...';
			var $overlay = $('div.talc-sheet');
			if ($overlay.is(':visible') == false) {
				$overlay.fadeIn();
			}
			$('div.global-loader').html(message);
		},
		hide: function() {
			stack -= 1;
			if (stack == -1) {
				stack = 0;
			}
			if (stack == 0) {
				$('div.talc-sheet').fadeOut();
			}
		}
	};
})();