(function() {

	var CurrentSprint = Backbone.Model.extend({

		defaults: function() {
			return {
				id: parseInt(Math.random() * 100000),
				name: 'Sprint #' + parseInt(Math.random() * 10000),
				started: new Date().getTime() - 7 * 24 * 3600 * 1000,
				ending: new Date().getTime() + 7 * 24 * 3600 * 1000,
				tasksTotal: 19,
				timeLeft: function() {
					var s = (this.ending - new Date().getTime()) / 1000;
					var daysLeft = parseInt(s / (60 * 60 * 24));
					return (daysLeft + ' ' + (daysLeft == 1 ? 'day' : 'days'));
				},
				timeTotal: function() {
					var s = (this.ending - this.started) / 1000;
					var daysLeft = parseInt(s / (60 * 60 * 24));
					return (daysLeft + ' ' + (daysLeft == 1 ? 'day' : 'days'));	
				}
			};
		}

	});

	var controller = new (function() {

		var toAppacitiveDate = function(date) {
			var d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
			if (d < 10) d = '0' + d;
			if (m < 10) m = '0' + m;
			return y + '-' + m + '-' + d;
		}

		var parseSprints = function(sprints) {
			var categories = [];
			var getStatusColor = function(progress) {
				return 'rgb(' + parseInt(255 - progress * 255) + ',' + parseInt(progress * 255) + ',0)';
			};

			for (var t = 0; t < sprints.length; t += 1) {
				var cs = new CurrentSprint;
				categories = sprints[t].stages[0].split('|');
				var startIndex = 0, actualStates = [];

				while (startIndex < categories.length) {
					actualStates.push({
						name: categories[startIndex++], 
						value: parseInt(Math.random() * 10)
					});
				}
				var ending = (parseInt(Math.random() * 13) + 1) * 24 * 3600 * 1000;
				cs.set('id', sprints[t].__id);
				cs.set('name', sprints[t].title);
				cs.set('started', new Date(sprints[t].start));
				cs.set('ending', new Date(sprints[t].end));
				cs.set('tasksDone', parseInt(Math.random() * cs.get('tasksTotal')));
				cs.set('tasksLeft', cs.get('tasksTotal') - cs.get('tasksDone'));
				var progress = new Date(sprints[t].start).getTime() / new Date(sprints[t].end).getTime();
				var totalPoints = cs.get('tasksTotal');
				var donePoints = cs.get('tasksDone');
				progress = progress * (donePoints / totalPoints);
				cs.set('progress', progress);
				cs.set('statusColor', getStatusColor(progress));
				cs.set('categories', actualStates);
				currentSprints.add(cs);
			}

			$(function() {
				$('#badgeCurrentSprints').html(currentSprints.length);
			});
		}

		this.loadCurrentSprints = function(onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			
			var projects = new Appacitive.ArticleCollection({ schema: 'project' });
			var thisProject = projects.createNewArticle();
			thisProject.set('__id', window.project.__id);
			var sprints = thisProject.getConnectedArticles({ relation: 'contains' });
			var searchUrl = sprints.getQuery().toRequest().url;
			var searchFilterString = toAppacitiveDate(new Date());
			searchUrl += '&query=(*end > date(\'' + searchFilterString + '\'))';
			var rq = new Appacitive.HttpRequest();
			rq.url = searchUrl;
			rq.onSuccess = function(data) {
				var sprintApiResult = [];
				if (data && data.status && data.status.code && data.status.code == '200') {
					data.connections = data.connections || [];
					data.connections.forEach(function(c) {
						var article = c.__endpointa.article || c.__endpointb.article;
						article.__connectionid = c.__id;
						sprintApiResult.push(article);
					});
					parseSprints(sprintApiResult);
					onSuccess();
				} else onError();
			};
			rq.onError = onError
			Appacitive.http.send(rq);
		}
	});

	var setupMenus = function() {
		$('ul.bs-docs-sidenav.main-menu').show();
		$('ul.bs-docs-sidenav.sprint-details-menu').hide();
		$('ul.bs-docs-sidenav.task-details-menu').hide();
		$('.menu-back').hide();
		if (window.modal) window.modal.modal('hide');
		$('.nav-options > li').removeClass('active');
		$('#currentSprintsMenuItem').addClass('active');
	};

	var SprintListing = Backbone.View.extend({

		el: $('div.content-container'),

		initialize: function() {
			this.render();
		},


		sprintSummaryViews: [],

		sprintSearch: function(e) {
			var searchString = this.$el.find('input#currentSprintSearch').val();
			this.sprintSummaryViews.forEach(function(ssv) {
				ssv.applySearch(searchString);
			});
		},

		sortByHealth: function() {
			currentSprints.comparator = function(cs) {
				return cs.get('progress');
			};
			currentSprints.sort({ silent: true });
			this.renderSprints();
		},

		sortByTasks: function() {
			currentSprints.comparator = function(cs) {
				return 0 - cs.get('tasksLeft');
			};
			currentSprints.sort({ silent: true });
			this.renderSprints();
		},

		sortByTime: function() {
			currentSprints.comparator = function(cs) {
				var timeLeft = cs.get('ending');
				return timeLeft;
			};
			currentSprints.sort({ silent: true });
			this.renderSprints();
		},

		render: function() {
			setupMenus();

			this.$el = $('div.content-container').empty();
			var template = $('#tmplCurrentSprintListing').html();
			var rendered = Mustache.render(template, {});
			var $element = $(rendered);
			var that = this;
			this.$el.append($element);
			this.renderSprints();
			$('input#currentSprintSearch').unbind('keyup').keyup(function() {
				that.sprintSearch.apply(that, arguments);
			});
			$('#btnAddSprint').unbind('click').click(function() {
				Backbone.history.navigate('sprints/create', { trigger: true });
			});
			
			$('.date').datepicker({
				format: 'yyyy/mm/dd',
				//startDate: startDate,
				autoclose: true
			});

			return this;
		},

		renderSprints: function() {
			$('#currentSprintListingContainer').empty();
			this.sprintSummaryViews.length = 0;
			var that = this;
			currentSprints.each(function (sprint) {
				var view = new SprintSummaryView({ model: sprint });
				$('#currentSprintListingContainer').append(view.render());
				that.sprintSummaryViews.push(view);
			});
		}

	});

	var SprintSummaryView = Backbone.View.extend({

		tagName: 'div',

		el: $('#currentSprintListingContainer'),

		render: function() {
			this.$el = $('#currentSprintListingContainer');
			var template = $('#tmplCurrentSprint').html();
			var rendered = Mustache.render(template, this.model.attributes);
			var $element = $(rendered);
			this.$element = $element;
			var sprintId = this.model.get('id'), title = this.model.get('name'), modelArticle = this.model.attributes;
			this.$element.click(function() {
				window.sprintId = sprintId;
				window.sprintName = title;
				window.previousLocation = Backbone.history.getHash();
				Backbone.history.navigate('sprints/details/' + sprintId, { trigger: true });
			});
			return this.$element;
		},

		applySearch: function(searchString) {
			var that = this;
			if (searchString.trim().length == 0 || this.model.get('name').toLowerCase().indexOf(searchString) != -1) {
				setTimeout(function() {
					that.$element.show();
				},0);
			} else {
				setTimeout(function() {
					that.$element.hide();
				},0);
			}
		}

	});

	var CurrentSprintCollection = Backbone.Collection.extend({
		
		model: CurrentSprint,

		comparator: function(cs) {
			return cs.get('name');
		}

	});
	var currentSprints = new CurrentSprintCollection;

	var CurrentSprintRouter = Backbone.Router.extend({

		routes: {
			'sprints/current': 'sprintListing'
		},

		sprintListing: function() {
			var fetchCurrentSprints = function() {
				if (!Appacitive.Users.currentUser) {
					Backbone.history.navigate('', { trigger: true });
					return;
				}
				window.loader.show('Loading current sprints');
				controller.loadCurrentSprints(function() {
					var sprintListing = new SprintListing;
					window.loader.hide();
				}, function() {
					$('.content-container').empty();
					window.loader.hide();
					window.alert.show('Hmmm, could not fetch your current sprints, have you been drinking?');
				});
			}
			if (Appacitive.session.get() == null) {
				Appacitive.eventManager.subscribe('session.success', fetchCurrentSprints);
			} else {
				fetchCurrentSprints();
			}
		}

	});
	var currentSprintRouter = new CurrentSprintRouter;

	$(function() {
		$('#currentSprintsMenuItem').click(function() {
			currentSprintRouter.navigate('sprints/current', { trigger: true });
		});
	});

})();