(function() {

	var updateDescription = function() {
		var description = $('#txtUserDescription').val();
		var userArticleCollection = new Appacitive.ArticleCollection({ schema: 'user' });
		var userArticle = userArticleCollection.createNewArticle();
		var onError = function() {
			console.dir(arguments);
			alert('could not update user profile');
		};

		userArticle.set('__id', window.user.__id);
		userArticle.fetch(function() {

			userArticle.set('description', description);
			userArticle.save(function() {
				var id = window.user.__id;
				var usermodel = window.users.filter(function(u) {
					return u.get('__id') == id;
				});
				if (usermodel.length != 1) onError('length of usermodel: ' + usermodel.length);
				usermodel = usermodel[0];
				usermodel.set('description', description);
				window.user.description = description;
				Backbone.history.navigate('users', { trigger: true });
			}, onError);
		}, onError);
	};

	var EditProfileView = Backbone.View.extend({
		
		render: function() {
			this.$el = $('div.content-container').empty();
			var template = $('#tmplEditProfile').html();
			var rendered = Mustache.render(template, window.user);
			var $element =$(rendered);
			$element.find('.btn-primary').click(function() {
				$(this).button('toggle');
				updateDescription();
			});
			this.$el.empty().append($element);
		}

	});


	var UserProfileRouter = Backbone.Router.extend({

		routes: {
			'profile': 'profile'
		},

		profile: function() {
			$('ul.bs-docs-sidenav.main-menu').show();
			$('.menu-back').hide();
			$('ul.bs-docs-sidenav.sprint-details-menu').hide();
			$('ul.bs-docs-sidenav.task-details-menu').hide();
			if (window.modal) window.modal.modal('hide');
			$('.nav-options	> li').removeClass('active');
			$('#editProfileMenuItem').addClass('active');
			var editProfileView = new EditProfileView;
			editProfileView.render();
		}
	});
	var UserProfileRouter = new UserProfileRouter;

	$(function() {
		$('#editProfileMenuItem').click(function() {
			Backbone.history.navigate('profile', { trigger: true });
		});
	});

})();