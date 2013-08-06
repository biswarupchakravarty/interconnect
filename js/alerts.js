(function() {

	window.alert = {
		show: function(message,type) {
			type=type||"danger";
			message = message || 'Oops, something went wrong. Try again in a few minutes.';
			$($('#tmplAlert').html()).prependTo($('.content-container')).find('#lblGlobalAlertMessage').html(message);
			$('#lblGlobalAlertMessage').parent().addClass('alert-'+type);
		},

		hide: function() {
			$('div.content-container div.alert.alert-danger').remove();
		}
	}

})()