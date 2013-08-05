$(function() {
	$.getJSON('/_/fetch', function(emails) {
		var index = 1;
		var headers = emails.map(function(e) {
			return {
				index: index++,
				from: e.headers.from,
				subject: e.headers.subject,
				date: new Date(e.headers.date).toDateString()
			};
		});
		console.dir(headers);
		$('div#emailListing').html(Mustache.render($('#tmplListing').html(), { mails: headers }));
	});
});