$(function() {
	$('.bs-docs-sidenav > li').click(function() {
		var $this = $(this);
		if ($this.data().subsection == true) {
			if ($this.find('i').hasClass('icon-chevron-right')) {
				$this.find('i').first().toggleClass('icon-chevron-down').toggleClass('icon-chevron-right');
				$('.subsection').slideDown();
			} else {
				$this.find('i').first().toggleClass('icon-chevron-down').toggleClass('icon-chevron-right');
				$('.subsection').slideUp();
			}
		} else {
			if ($this.hasClass('active')) return;
			$this.parent().find('li').removeClass('active');
			$this.addClass('active');
		}
	});


	// menu navigation 
	$('#lnkCreateProject').die('click').live('click', function() {
		Backbone.history.navigate('projects/create', { trigger: true });
	});
	$('#lnkAdminister').die('click').live('click', function() {
		Backbone.history.navigate('administer', { trigger: true });
	});
	$('#lnkMessages').die('click').live('click', function() {
		Backbone.history.navigate('messages', { trigger: true });
	});
});