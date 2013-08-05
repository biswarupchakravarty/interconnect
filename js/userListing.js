(function() {
	var _lastUserId = 1;
	var User = Backbone.Model.extend({
		defaults: function() {
			return {
				id: _lastUserId += 1,
				name: 'DeepClone #' + parseInt(Math.random() * 100),
				skill_level: function() {
					switch (parseInt(this.bugs/20)) {
						case 0: return 'Noob';
						case 1: return 'Amateur';
						case 2: return 'Experienced';
						case 3: return 'Professional';
						case 4: return 'Ninja';
					}
				},
				skill_description: function() {
					switch (this.skill_level().toLowerCase()) {
						case 'noob': return 'Beginner, fixed 20 bugs or less';
						case 'amateur': return 'Amateur, fixed from 20 to 40 bugs';
						case 'experienced': return 'Experienced, fixed from 40 to 60 bugs';
						case 'professional': return 'Professional, fixed from 60 to 80 bugs';
						case 'ninja': return 'Ninja, fixed 80 bugs or more';
					}
				},
				total: function() { return this.bugs * this.features },
				bugs: parseInt(Math.random() * 100),
				features: parseInt(Math.random() * 30),
				isAdmin: false,
				description: 'No description has been set.'
			};
		}
	});

	var UserSummaryView = Backbone.View.extend({

		tagName: 'tr',

		initialize: function() {
			this.listenTo(this.model, "change", this.render);
			this.listenTo(this.model, "destroy", this.remove);
			this.listenTo(this.model, "destroy", this.removeFromCollection);
		},

		fireUser: function() {
			users.remove(this.model);
			this.remove();
		},

		events: {
			'click .btn-user-details': 'showDetails',
			'click .btn-user-remove': 'fireUser'
		},

		showDetails: function() {
			var userId = this.model.get('id');
			userRouter.navigate('users/' + userId, { trigger: true });
		},

		render: function() {
			this.template = $('#tmplUserSummary').html(),
			this.$el.html(Mustache.render(this.template, this.model.attributes));
			return this;
		},

		applySearch: function(searchString) {
			var that = this;
			if (searchString.trim().length == 0 || this.model.get('name').toLowerCase().indexOf(searchString) != -1) {
				setTimeout(function() {
					that.$el.show();
				},0);
			} else {
				setTimeout(function() {
					that.$el.hide();
				},0);
			}
		}
	});

	var UserCollection = Backbone.Collection.extend({
		model: User,

		comparator: function(u) {
			return 0 - (u.get('bugs') * u.get('features'));
		}
	});

	window.users = new UserCollection;

	var UserListingView = Backbone.View.extend({

		el: $('div.content-container'),

		userSummaryViews: [],

		events: {
			'keyup input#userListingSearch': 'userSearch'
		},

		userSearch: function(e) {
			var searchString = this.$el.find('input#userListingSearch').val();
			this.userSummaryViews.forEach(function(usv) {
				usv.applySearch(searchString);
			});
		},

		initialize: function() {
			this.$el = $('div.content-container');
			this.listenTo(users, 'add', this.addUser);
			this.render();
		},

		addUser: function(user) {
			this.render();
		},

		render: function() {
			this.$el.empty().append($($('#tmplUserListing').html()));
			var $container = $('#userSummaryContainer').empty(), that = this;
			users.each(function(user, index) {
				user.set('alternate', index % 2 == 1);
				user.set('index', index + 1);
				var userSummaryView = new UserSummaryView({ model: user });
				$container.append(userSummaryView.render().$el);
				that.userSummaryViews.push(userSummaryView);
			});
		}
	});

	var UserRouter = Backbone.Router.extend({
		routes: {
			'users': 'users',
			'users/:id': 'details'
		},

		initialize: function() {
			Appacitive.eventManager.subscribe('1login.success', function() {
				var userCollection = new Appacitive.ArticleCollection({ schema: 'user' });
				window.loader.show('fetching users');
				userCollection.fetch(function() {
					window.loader.hide();
					$('#badgeUsers').html(userCollection.getAll().length);
					userCollection.getAll().forEach(function(user) {
						user = user.getArticle();
						var u = new User;
						for (var key in user) {
							if (!user.hasOwnProperty(key)) continue;
							u.set(key, user[key]);
						}
						u.set('name', user.firstname + ' ' + user.lastname);
						if (user.__id == window.user.__id) u.set('me', true);
						Appacitive.Users.getLinkedAccounts(user.__id, function(identities) {
							var fbIdentity = identities.filter(function (identity) {
								return identity.authtype.toLowerCase() == 'facebook';
							})[0];
							u.set('profile_picture', Appacitive.facebook.getProfilePictureUrl(fbIdentity.username));
							users.add(u);
						});
					});
				});
			});
		},

		users: function() {
			$('ul.bs-docs-sidenav.main-menu').show();
			$('ul.bs-docs-sidenav.sprint-details-menu').hide();
			if (window.modal) window.modal.modal('hide');
			$('.nav-options	> li').removeClass('active');
			$('#userListingMenuItem').addClass('active');
			var userListing = new UserListingView;
		},

		details: function(id) {
			$('ul.bs-docs-sidenav.main-menu').show();
			$('ul.bs-docs-sidenav.sprint-details-menu').hide();
			$('ul.bs-docs-sidenav.task-details-menu').hide();
			$('.menu-back').hide();
			var userListing = new UserListingView;
			var user = users.get(id);
			if (!user) {
				$('#userModalSaveChanges').hide();
				$('#userModalHeader').html('User does not exist');
				$('#userModalDetails').html('Cannot find user with id: ' + id + '. Either the user has not signed up yet, has deleted their account or the id is incorrect.');
				$('#divUserModesContainer').hide();
			} else {
				$('#userModalSaveChanges').show();
				$('#userModalHeader').html(user.get('name'));
				$('#userModalDetails').html(JSON.stringify(user.attributes));
				$('#divUserModesContainer > button').removeClass('active');
				if (user.get('isAdmin')) {
					$('#btnUserAdmin').addClass('active');
				} else {
					$('#btnUserRegular').addClass('active');
				}
			}
			$('div#userModalFooter > button').unbind('click').click(function() {
				userRouter.navigate('users');
			});
			$(document.body).keyup(function(e) {
				if (e.which == 27) {
					$('#userModalCancelChanges').click();
					$(document.body).unbind('keyup');
				} else if (e.which == 13) {
					$('#userModalSaveChanges').click();
					$(document.body).unbind('keyup');
				}
			})
			window.modal = $('#userModal').modal({
				keyboard: false
			});
			window.modal.on('hide', function() {
				if (Backbone.history.getHash().indexOf('users') == 0)
					Backbone.history.navigate('users');
			});
		}
	});
	var userRouter = new UserRouter;

	$(function() {
		$('#userListingMenuItem').click(function() {
			userRouter.navigate('users', { trigger: true });
		});
		Backbone.history.start();
	});

})();