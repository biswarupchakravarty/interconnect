(function() {

	"use strict";

	var controller = new (function() {

		var _getProjects = function(userId, onSuccess, onError) {

			if (window.cache.projects && window.cache.projects.length > 0) {
				onSuccess(window.cache.projects);
				return;
			}

			var userCollection = new Appacitive.ArticleCollection({ schema: 'user' });
			var user = userCollection.createNewArticle();
			user.set('__id', userId);
			var organizations = user.getConnectedArticles({ relation: 'member' });

			//-----------------------------------------------
			// TODO: Use sdk method when support for filtering on connected articles query is provided
			var onError1 = window.loader.hide;
			var searchUrl = organizations.getQuery().toRequest().url;
			var projects = [];
			searchUrl += '&query=(*archived == false)';
			var rq = new Appacitive.HttpRequest();
			rq.url = searchUrl;
			rq.onSuccess = function(data) {
				window.loader.hide();
				if (data && data.status && data.status.code && data.status.code == '200') {
					data.connections = data.connections || [];
					data.connections.forEach(function(c) {
						var article = c.__endpointa.article || c.__endpointb.article;
						article.__connectionid = c.__id;
						projects.push(article);
					});
					cache.projects = projects;
					onSuccess(projects);
				} else onError1();
			};
			rq.onError = onError1;
			Appacitive.http.send(rq);
			//-----------------------------------------------
		};

		this.loadProjects = function(onSuccess, onError) {
			if (window.user && window.user.__id) {
				window.loader.show('Fetching projects');
				_getProjects(window.user.__id, onSuccess, onError);
			} else {
				onError();
			}
		};

	})();

	var HomeView = Backbone.View.extend({

		el: $('.content-container'),

		initialize: function() {
			this.render();
		},

		projectMenuItemTemplate: '<li class="subsection project-menu-item" id="{{__id}}"><a href="javascript:void(0)" class="project-name-link">{{name}}</a></li>',

		selectProject: function(identifier) {
			var that = this;
			var selectedProject = that.model.projects[that.model.projects.length - 1];
			var $firstMenuItem = $('.project-menu > li').first();
			$firstMenuItem.find('span').html(selectedProject.name);
			$('li#' + selectedProject.__id).addClass('active');
			window.cache.project = selectedProject;
			window.project = selectedProject;
			Appacitive.eventManager.fire('project.select', this, {});
		},

		populateProjects: function() {
			var that = this;
			if (that.model && that.model.projects && that.model.projects.length > 0) {
				$('.project-menu-item').remove();
				var $firstMenuItem = $('.project-menu > li').first();
				that.model.projects.forEach(function (project) {
					var rendered = Mustache.render(HomeView.prototype.projectMenuItemTemplate, project);
					$(rendered).insertAfter($firstMenuItem);
				});
				that.selectProject();
				$('.actions-menu').show();
			}
		},

		render: function() {
			this.$el = $('.content-container').empty();
			var template = $('#tmplHomePage').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			this.$el.append($element);
			$('.span3 > ul').hide();
			$('.project-menu').show();
			$('.span3 > ul > li').removeClass('active');
			$('#lnkHomePage').parent().addClass('active');
			$('.subsection').hide();
			this.populateProjects();
			setTimeout(window.loader.hide, 500);
		}

	});

	var HomeRouter = Backbone.Router.extend({

		routes: {
			'': 'showHome'
		},

		initialize: function() {
			var that = this;

			Appacitive.eventManager.subscribe('login.success', function() {
				if (Backbone.history.getHash().length === 0) {
					that.showHome();
				}
			});
		},

		showHome: function() {
			var that = this;
			controller.loadProjects(function(projects) {
				that.homeView = new HomeView({
					model: {
						projects: projects
					}
				});
			}, function() {
				that.homeView = new HomeView({ model: {} });
			});
		}

	});
	var homeRouter = new HomeRouter();

})();