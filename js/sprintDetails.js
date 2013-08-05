(function() {

	var controller = new (function() {

		this.fetchTasks = function(sprint, onSuccess, onError) {
			var tasks = sprint.getConnectedArticles({ relation: 'sprint_task' });
			var taskArticles = [];
			tasks.fetch(function() {
				tasks.getAll().forEach(function (task) {
					taskArticles.push(task.connectedArticle.getArticle());
				});
				onSuccess(sprint.getArticle(), taskArticles);
			}, onError);
		};

		this.fetchSprint = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function(){}; 
			onError = onError || function(){};
			var sprints = new Appacitive.ArticleCollection({ schema: 'sprint' });
			var sprint = sprints.createNewArticle();
			sprint.set('__id', id);
			sprint.fetch(function() {
				onSuccess(sprint);
			}, onError);
		}

	})();

	var _lipsum = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');
	var colors = ['rgba(0, 100, 0, 0.6)', 'rgba(255, 140, 0, 0.6)', 'rgba(138, 0, 0, 0.6)'];

	var _parseModel = function(sprint, tasks) {
		var model = {};
		model.id = sprint.__id;
		model.name = sprint.title;
		model.daysLeft = new Date(sprint.end).getTime() - new Date().getTime();
		model.daysLeft /= (24 * 3600 * 1000);
		model.daysLeft = parseInt(model.daysLeft);
		model.isActive = model.daysLeft > 0;
		if (model.daysLeft > 1) model.daysLeft = 'Due in <b>' + model.daysLeft + ' days</b>';
		if (model.daysLeft < -1) model.daysLeft = 'Completed ' + (0 - model.daysLeft) + ' days ago';
		switch (model.daysLeft) {
			case 0: model.daysLeft = 'Due <b>today</b>'; break;
			case 1: model.daysLeft = 'Due <b>tomorrow</b>'; break;
			case -1: model.daysLeft = 'Completed yesterday'; break;
		}
		model.endingDate = new Date(sprint.end).toLocaleDateString();
		model.tasksPending = (model.tasksTotal || 10) - (model.tasksDone || 4);
		var modelStages = sprint.stages[0].split('|');
		var numStages = modelStages.length;
		model.stages = [];
		for (var x = 0; x < numStages; x += 1) {
			model.stages[x] = { 
				name: modelStages[x],
				tasks: tasks.filter(function (task) {
					var taskStage = task.stage || 'New';
					return (modelStages[x].toLowerCase() == taskStage.toLowerCase());
				}).map(function (task, taskIndex) {
					return {
						id: task.__id,
						name: task.title,
						description: task.description,
						descriptionSummary: task.description.length > 30 ? task.description.substr(0, 25) + '...' : task.description,
						index: taskIndex,
						users: [],
						numUsers: parseInt(Math.random() * 9),
						priority: task.priority,
						color: colors[task.priority - 1],
						numComments: parseInt(Math.random() * 19)
					}
				}),
				index: x
			};
		}
		return model;
	};

	var setupMenus = function() {
		$('ul.bs-docs-sidenav.main-menu').hide();
		$('.menu-back').show();
		$('ul.bs-docs-sidenav.sprint-details-menu').show();
		$('ul.bs-docs-sidenav.task-details-menu').hide();
	}

	var SprintDetailsView = Backbone.View.extend({

		initialize: function() {
			this.render();
		},

		render: function() {
			setupMenus();
			$('#lnkBack').click(function() {
				window.previousLocation = window.previousLocation || 'sprints/current';
				Backbone.history.navigate(window.previousLocation, { trigger: true });
			}).removeClass('active');
			this.$el = $('div.content-container').empty();
			var template = $('#tmplSprintDetails').html();
			var model = _parseModel(this.model.sprint, this.model.tasks);
			var rendered = Mustache.render(template, model);
			var $element = $(rendered);
			$element.find('div[rel="popover"].task-summary').click(function() {
				$(this).toggleClass('task-summary-active');
			}).popover({
				placement: 'bottom',
				html: true,
				trigger: 'click',
				content: function() {
					var task = {
						description: model.stages[$(this).parent().data('stageindex')].tasks[$(this).data('taskindex')].description,
						numUsers: model.stages[$(this).parent().data('stageindex')].tasks[$(this).data('taskindex')].numUsers || null,
						numComments: model.stages[$(this).parent().data('stageindex')].tasks[$(this).data('taskindex')].numComments || null,
						users: model.stages[$(this).parent().data('stageindex')].tasks[$(this).data('taskindex')].users || [],
						sprintid: model.id,
						id: model.stages[$(this).parent().data('stageindex')].tasks[$(this).data('taskindex')].id
					};
					return Mustache.render($('#tmplTaskPopoverContent').html(), task);
				},
				title: function() {
					var task = {
						name: model.stages[$(this).parent().data('stageindex')].tasks[$(this).data('taskindex')].name
					};
					$('div.task-summary').not(this).popover('hide').removeClass('task-summary-active');
					return Mustache.render($('#tmplTaskPopoverTitle').html(), task);
				}
			});
			$('#lnkAddCardToSprint').click(function() {
				window.previousLocation = Backbone.history.getHash();
				Backbone.history.navigate('sprints/' + window.sprintId + '/tasks/create', { trigger: true });
			});
			this.$el.append($element);

			$('button.sprint-details-button').die('click').live('click', function() {
				var data = $(this).data();
				var hash = 'sprints/' + model.id + '/tasks/' + data.id;
				Backbone.history.navigate(hash, { trigger: true });
			});
		}

	});

	var SprintDetailsRouter = Backbone.Router.extend({

		routes: {
			'sprints/details/:id': 'sprint'
		},

		initialize: function() {
			// nothing to do here
		},

		sprint: function(id) {
			var onError = function() {
				window.loader.hide();
				window.alert.hide();
				window.alert.show('Shucks! Something bad happened, we cannot fetch ' + window.sprintName + '. Try again in a minute. Or you could contact support.');
			}
			var load = function() {
				window.loader.show('Fetching sprint details');
				controller.fetchSprint(id, function (sprint) {
					window.loader.hide();
					window.loader.show('Fetching tasks for "' + sprint.get('title') + '"');
					controller.fetchTasks(sprint, function (sprintArticle, taskArticles) {
						var model = { 
							model: {
								sprint: sprintArticle,
								tasks: taskArticles
							}
						};
						var sprintDetailsView = new SprintDetailsView(model);
						window.loader.hide();
					}, onError);
				}, onError)
			}
			if (Appacitive.session.get() == null || !Appacitive.Users.currentUser) {
				Backbone.history.navigate('', { trigger: true });
				return;
			}
			load();
		}
	});
	var sprintDetailsRouter = new SprintDetailsRouter;

})();