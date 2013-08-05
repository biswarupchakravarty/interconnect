/* jslint browser:true */

(function() {
	"use strict";

	if (window.localStorage1) {
		window.cache = window.localStorage;
	} else {
		window.cache = {};
		window.cache.clear = function() {
			window.cache = 0;
		};
	}

})();