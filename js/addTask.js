(function() {

	var controller = new (function() {

		this.createTask = function(name, description, priority, onSuccess, onError) {
			var tasks = new Appacitive.ArticleCollection({ schema: 'task' });
			var task = tasks.createNewArticle();
			task.set('title', name);
			task.set('description', description);
			task.set('priority', priority);

			var buggy = function() {
				window.loader.hide();
				window.alert.show('Oops!! Could not save your task, something bad happened. Try again in a minute or two. In case there\'s still no joy, contact support.');
				if (typeof onError == 'function') onError();
			};

			window.alert.hide();
			window.loader.show('Creating task: "' + name + '"');
			task.save(function() {
				var connectOptions = {
	                __endpointa: {
	                    articleid: window.sprintId,
	                    label: 'sprint'
	                },
	                __endpointb: {
	                    articleid: task.get('__id'),
	                    label: 'task'
	                }
	            };
	            var cC = new Appacitive.ConnectionCollection({ relation: 'sprint_task' });
	            var connection = cC.createNewConnection(connectOptions);
	            connection.save(function () {
	            	window.loader.hide();
	                onSuccess();
	            }, buggy);
			}, buggy);
		};

	})();

	var setupMenus = function() {
		$('.span3 > ul').hide();
		$('.menu-back').show();
		var sN = window.sprintName || '';
		if (sN.length > 15) sN = sN.substr(0, 14) + '...';
		$('#lblMenuBackContents').html('Back to "' + sN + '"');
		$('#lnkBack').unbind('click').click(function() {
			Backbone.history.navigate('sprints/details/' + window.sprintId, { trigger: true });
		});
	}

	var AddTaskView = Backbone.View.extend({

		el: $('.content-container'),

		render: function() {
			this.$el = $('.content-container').empty();
			var template = $('#tmplAddTask').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			this.$el.append($element);

			setupMenus();

			$('#btnCreateTask').unbind('click').click(function() {
				var name = $('#txtCreateTaskTaskName').val().trim();
				var description = $('#txtCreateTaskTaskDescription').val().trim();
				var priority = $('#slctTaskPriority > option:selected').attr('value');
				if (name.length == 0) {
					window.alert.hide();
					window.alert.show('Each task needs a name.');
					$('#txtCreateTaskTaskName').focus();
				} else if (description.length == 0) {
					window.alert.hide();
					window.alert.show('Each task needs a description.');
					$('#txtCreateTaskTaskDescription').focus();
				} else {
					window.alert.hide();
					controller.createTask(name, description, priority, function() {
						Backbone.history.navigate('sprints/details/' + window.sprintId, { trigger: true });
					});
				}
			});
		}

	});

	var AddTaskRouter = Backbone.Router.extend({
		routes: {
			'sprints/:id/tasks/create': 'create'
		},

		create: function(id) {
			$('ul.bs-docs-sidenav.main-menu').hide();
			$('ul.bs-docs-sidenav.sprint-details-menu').show();
			$('.nav-options > li').removeClass('active');
			if (window.modal) window.modal.modal('hide');
			$('#lnkAddCardToSprint').addClass('active');
			if (Appacitive.session.get() == null || !Appacitive.Users.currentUser) {
				Backbone.history.navigate('', { trigger: true });
				return;
			}
			var addTaskView = new AddTaskView({
				model: {
					name: window.sprintName
				} 
			});
			addTaskView.render();
		}
	});
	var addTaskRouter = new AddTaskRouter;
})();