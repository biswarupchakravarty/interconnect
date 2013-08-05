(function() {

	var controller = new (function() {

		var createProject = function(name, description, onSuccess, onError) {
			var projectCollection = new Appacitive.ArticleCollection({ schema: 'project'});
			var project = projectCollection.createNewArticle();
			project.set('name', name);
			project.set('description', description);
			project.save(function() {
				var projectId = project.get('__id');
				var connectOptions = {
	                __endpointa: {
	                    articleid: projectId,
	                    label: 'project'
	                },
	                __endpointb: {
	                    articleid: window.user.__id,
	                    label: 'user'
	                }
	            };
	            var cC = new Appacitive.ConnectionCollection({ relation: 'member' });
	            var connection = cC.createNewConnection(connectOptions);
	            connection.set('creator', 'true');
	            connection.set('admin', 'true');

	            connection.save(function () {
	                onSuccess();
	            }, function () {
	                (onError || function(){})();
	            });
			}, onError || function(){});
		};

		this.createProject = function(name, description, onSuccess, onError) {
			createProject(name, description, onSuccess, onError);
		};

	})();

	var CreateProjectView = Backbone.View.extend({

		initialize: function() {
			this.$el = $(document);
			this.render();
		},

		showApiError: function() {
			window.loader.hide();
			this.displayAlert('Oops, we could not create your organization, please try again later.', 'error');
		},

		showApiSuccess: function() {
			window.loader.hide();
			var that = this;
			this.displayAlert('Successfully created your project, redirecting in 3 seconds', 'success');
			setTimeout(function() {
				that.onApiSuccess.apply(that);
			}, 3000);
		},

		displayAlert: function(message, type) {
			$('.alert-container').empty();
			$('#lblAlertMessage').html(message);
			var $alert = $($('.create-project-alert-template').html());
			$alert.addClass('alert-' + type);
			$('.alert-container').append($alert.fadeIn());
		},

		validateKeyboard: function(e) {
			if (e && e.which && e.which == 13) {
				this.validate();
			}
		},

		gotoHome: function() {
			Backbone.history.navigate('/', { trigger: true });
		},

		onApiSuccess: function() {
			Backbone.history.navigate('', { trigger: true });
		},

		validate: function() {
			$('.alert-container').empty();
			if ($('#txtCreateProjectProjectName').val().trim().length === 0 || $('#txtCreateProjectProjectDescription').val().trim().length === 0) {
				this.displayAlert('Hey, you need to fill in both the fields.', 'error');
				if ($('#txtCreateProjectProjectDescription').val().trim().length === 0) {
					$('#txtCreateProjectProjectDescription').focus();
				}
				if ($('#txtCreateProjectProjectName').val().trim().length === 0) {
					$('#txtCreateProjectProjectName').focus();
				}
			} else {
				var name = $('#txtCreateProjectProjectName').val().trim();
				var description = $('#txtCreateProjectProjectDescription').val().trim();
				var that = this;
				window.loader.show('Creating project ' + name);
				var onSuccess = function() {
					that.showApiSuccess.apply(that);
				};
				var onError = function() {
					that.showApiError.apply(that);
				};
				controller.createProject(name, description, onSuccess, onError);
			}
		},

		render: function() {
			$('.span3 > ul').hide();
			$('.project-menu').show();
			$container = $('.content-container').empty();
			var template = $('#tmplCreateProject').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			var that = this;
			$container.append($element);
			$('.span3 > ul > li').removeClass('active');
			$('#lnkCreateProject').parent().addClass('active');
			$('#txtCreateProjectProjectName').focus();

			$('#btnCreateProject').unbind('click').click(function() {
				that.validate.apply(that, arguments);
			});
			$('#txtCreateProjectProjectName').unbind('keypress').keypress(function() {
				that.validateKeyboard.apply(that, arguments);
			});
			$('#lnkHomePage').unbind('click').click(this.gotoHome);
		}

	});

	var CreateProjectRouter = Backbone.Router.extend({

		routes: {
			'projects/create': 'createProject'
		},

		createProject: function() {
			var createProjectView = new CreateProjectView();
		}

	});
	var createProjectRouter = new CreateProjectRouter();

})();