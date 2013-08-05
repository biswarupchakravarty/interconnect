(function() {

	window.alert = {
		show: function(message) {
			message = message || 'Oops, something went wrong. Try again in a few minutes.';
			$($('#tmplAlert').html()).prependTo($('.content-container')).find('#lblGlobalAlertMessage').html(message);
		},

		hide: function() {
			$('div.content-container div.alert.alert-danger').remove();
		}
	}

})()