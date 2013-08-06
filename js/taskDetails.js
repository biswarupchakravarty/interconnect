(function() {

	var controller = new (function() {

		var _task = null;

		this.fetchTask = function(taskId, onSuccess, onError) {
			var tasks = new Appacitive.ArticleCollection({ schema: 'task' });
			var task = tasks.createNewArticle();
			task.set('__id', taskId);
			task.fetch(function() {
				_task = task;
				onSuccess(task);
			}, onError);
		};

		this.fetchSprint = function(sprintId, onSuccess, onError) {
			onSuccess = onSuccess || function(){}; 
			onError = onError || function(){};
			var sprints = new Appacitive.ArticleCollection({ schema: 'sprint' });
			var sprint = sprints.createNewArticle();
			sprint.set('__id', sprintId);
			sprint.fetch(function() {
				onSuccess(sprint);
			}, onError);
		};

		this.fetchAllUsers = function(projectId, onSuccess, onError) {
			var projects = new Appacitive.ArticleCollection({ schema: 'task' })
				, project = projects.createNewArticle({ __id: projectId })
				, users = project.getConnectedArticles({ relation: 'member' });

			users.fetch(function() {
				onSuccess(users.getAll().map(function (u) { return u.connectedArticle.getArticle(); }));
			}, onError);
		};

		this.fetchUsersAndComments = function(taskId, onSuccess, onError) {
			var tasks = new Appacitive.ArticleCollection({ schema: 'task' })
				, task = tasks.createNewArticle({ __id: taskId })
				, users = task.getConnectedArticles({ relation: 'task_user' })
				, comments = task.getConnectedArticles({ relation: 'task_comment' })
				, result = { comments: [], users: [] }
				, allDone = false;

			comments.fetch(function() {
				result.comments = comments.getAll().map(function (c) { return c.connectedArticle.getArticle(); });
				if (allDone) onSuccess(result.users, result.comments);
				allDone = true;
			}, function() {
				result.comments = comments.getAll().map(function (c) { return c.connectedArticle.getArticle(); });
				if (allDone) onSuccess(result.users, result.comments);
				allDone = true;
			});

			users.fetch(function() {
				result.users = users.getAll().map(function (u) { return u.connectedArticle.getArticle(); });
				if (allDone) onSuccess(result.users, result.comments);
				allDone = true;
			}, function() {
				result.users = users.getAll().map(function (u) { return u.connectedArticle.getArticle(); });
				if (allDone) onSuccess(result.users, result.comments);
				allDone = true;
			});
		};

		this.updatePriority = function(priority, onSuccess, onError) {
			var tasks = new Appacitive.ArticleCollection({ schema: 'task' });
			var task = tasks.createNewArticle({ 
				__id: _task.get('__id')
			});

			task.fetch(function() {
				task.set('priority', priority);
				task.save(onSuccess, onError);
			}, onError);
		};

	})();



	var _lipsum = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');
	var colors = ['rgba(0, 100, 0, 0.6)', 'rgba(255, 140, 0, 0.6)', 'rgba(138, 0, 0, 0.6)'];

	var _parseSprint = function(model) {
		model.id = model.id || parseInt(Math.random() * 100000);
		model.name = model.name || 'Sprint #' + parseInt(Math.random() * 10000);
		model.daysLeft = model.ending - new Date().getTime();
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
		model.endingDate = new Date(model.ending).toLocaleDateString();
		model.tasksPending = model.tasksTotal - model.tasksDone;
		model.stages = [];
		var numStages = parseInt(Math.random() * 5) + 2;
		for (var x=0;x<numStages;x+=1) {
			model.stages[x] = { 
				name: 'Stage #' + x,
				tasks: [],
				index: x
			};
			var tasksInStage = parseInt(Math.random() * 7) + 2;
			for (var y=0;y<tasksInStage;y+=1) {
				var desc = _lipsum.slice(0, parseInt(Math.random() * _lipsum.length - 10) + 9).join(' ');
				var numUsers = parseInt(Math.random() * 6) + 2;
				model.stages[x].tasks[y] = {
					id: parseInt(Math.random() * 10000),
					name: _lipsum[parseInt(Math.random() * _lipsum.length)] + ' ' + _lipsum[parseInt(Math.random() * _lipsum.length)] + ' ' + _lipsum[parseInt(Math.random() * _lipsum.length)],
					description: desc,
					descriptionSummary: desc.length > 30 ? desc.substr(0, 25) + '...' : desc,
					index: y,
					users: [],
					numUsers: numUsers,
					priority: parseInt(Math.random() * 3) + 1,
					numComments: parseInt(Math.random() * 10)
				};
				model.stages[x].tasks[y].color = colors[model.stages[x].tasks[y].priority - 1];

				// users				
				for (var z=0;z<numUsers;z+=1) {
					model.stages[x].tasks[y].users[z] = {
						index: z,
						name: 'DeepClone #' + parseInt(Math.random() * 10000)
					};
				}

				// images
				model.stages[x].tasks[y].images = [];
				var numImages = parseInt(Math.random() * 5) + 1;
				for (var zz=0; zz<numImages; zz+=1) {
					model.stages[x].tasks[y].images.push({
						
					});
				}

				// comments
				model.stages[x].tasks[y].comments = [];
				var numComments = parseInt(Math.random() * 15) + 3;
				for (var zz=0; zz<numComments; zz+=1) {
					model.stages[x].tasks[y].comments.push({
						username: 'DeepClone #' + parseInt(Math.random() * 10000),
						description: _lipsum.slice(0, parseInt(Math.random() * _lipsum.length - 10) + 10).join(' '),
						date: new Date().getTime() - (24 * 3600 * 1000 * Math.random() * 30),
						dateDisplay: function() {
							var diff = new Date() - this.date;
							diff /= 1000;
							if (diff < 60) return 'less than a minute ago';
							if (diff < 3600) return parseInt(diff/60) + ' minutes ago';
							if (diff < (3600 * 24)) return parseInt(diff / 3600) + ' hours ago';
							return parseInt(diff / (3600 * 24)) + ' days ago';
						}
					});
				}
				model.stages[x].tasks[y].comments = model.stages[x].tasks[y].comments.sort(function(a, b) {
					return b.date - a.date;
				});
			}
		}

		return model;
	};

	var setupMenus = function() {
		$('ul.bs-docs-sidenav.main-menu').hide();
		$('ul.bs-docs-sidenav.sprint-details-menu').hide();
		$('ul.bs-docs-sidenav.task-details-menu').show();
		$('.menu-back').show();
	}

	var TaskDetailView = Backbone.View.extend({

		el: $('.content-container'),

		initialize: function() {
			this.render();
		},

		events: {
			'click #AddComment': 'addComment'
			},

		addComment: function() {
			var comments = new Appacitive.ArticleCollection({ schema:'comment'});
			var comment = comments.createNewArticle();
			comment.set('comment',$('#txtComment').val());
			comment.save(function() {
    			console.log("got it");
				}, function() {
    			console.log("didnt get it");
			});
		},

	    createComment : function(onSuccess, onError) {
		var userId = window.user.__id;
		var projectId = window.invite.organizationid;
		var connectOptions = {
	        __endpointa: {
	            articleid: taskId,
	            label: 'task'
	        },
	        __endpointb: {
	            articleid: window.comment.__id,
	            label: 'comment'
	        }
	    };
	    var cC = new Appacitive.ConnectionCollection({ relation: 'task_comment' });
	    var connection = cC.createNewConnection(connectOptions);

	    connection.save(function () {
	        if (onSuccess && typeof onSuccess == 'function')
	        	onSuccess();
	    }, function () {
	        (onError || function() {
    	    	window.alert.show('Oops, something went wrong either while trying to connect this comment to the task!!');
	        });
	    	});
		},

		render: function() {
			setupMenus();
			this.$el = $('.content-container').empty();
			var currentHash = Backbone.history.getHash();
			var sId = currentHash.split('/')[1];
			var sprint = this.model.sprint, task = this.model.task;

			$('#lnkBack').click(function() {
				window.previousLocation = 'sprints/details/' + sId;
				Backbone.history.navigate(window.previousLocation, { trigger: true });
			}).removeClass('active');
			
			var template = $('#tmplTaskDetails').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			this.$el.append($element);

			$('a.thumbnail').click(function() {
				var $controls = $(this).find('.thumbnail-content-details');
				$('.thumbnail-content-details').not($controls).hide();
				$('a.thumbnail').not(this).removeClass('thumbnail-active');
				$controls.slideToggle(100);
				$(this).toggleClass('thumbnail-active');
			});

			$('div.media').click(function() {
				var $controls = $(this).find('div.comment-delete');
				$('div.media').not($(this)).removeClass('media-active');
				$('div.comment-delete').not($controls).hide();
				$(this).toggleClass('media-active');
				$controls.toggle();
			});
			var changeButtonClass = function(priority, classToApply, buttonCaption) {
				priority += '';
				return function() {
					window.alert.hide();
					window.loader.show('Setting priority to "' + buttonCaption + '"');
					controller.updatePriority(priority, function() {
						window.loader.hide();
						$('.btn-priority')
							.removeClass('btn-danger')
							.removeClass('btn-success')
							.removeClass('btn-warning')
							.addClass(classToApply)
							.find('.button-text').html(buttonCaption);
					}, function() {
						window.loader.hide();
						window.alert.hide();
						window.alert.show('Hmmm... Something broke and we could not update the priority. Try again in a minute or contact support.');
					});
				};
			};

			$('#slctTaskUser').select2();

			var priorityList = ['High Priority', 'Medium Priority', 'Low Priority'];
			var captionList = ['btn-danger', 'btn-warning', 'btn-success'];

			$('#lnkHighPriority').click(changeButtonClass(0, captionList[0], priorityList[0]));
			$('#lnkMediumPriority').click(changeButtonClass(1, captionList[1], priorityList[1]));
			$('#lnkLowPriority').click(changeButtonClass(2, captionList[2], priorityList[2]));

			var currentPriority = this.model.task.priority || 2;
			$('.btn-priority')
				.removeClass('btn-danger')
				.removeClass('btn-success')
				.removeClass('btn-warning')
				.addClass(captionList[currentPriority])
				.find('.button-text').html(priorityList[currentPriority]);
		}

	})

	var TaskDetailsRouter = Backbone.Router.extend({

		routes: {
			'sprints/:sid/tasks/:id': 'taskDetails'
		},

		taskDetails: function(sid, id) {
			var onError = function() {
				window.loader.hide();
				window.alert.hide();
				window.alert.show('Do not panic, but something broke while fetching your data. Try again in a minute or contact support.');
			}

			var load = function() {
				window.loader.show('Fetching sprint details');
				controller.fetchSprint(sid, function (sprint) {
					window.loader.hide();
					window.loader.show('Fetching tasks for "' + sprint.get('title') + '"');
					controller.fetchTask(id, function (task) {
						controller.fetchAllUsers(window.project.__id, function(allUsers) {
							controller.fetchUsersAndComments(id, function (assignedUsers, comments) {
								var model = { 
									model: {
										sprint: sprint.getArticle(),
										task: task.getArticle(),
										users: allUsers,
										members: assignedUsers,
										comments: comments
									}
								};
								console.dir(model);
								var taskDetailView = new TaskDetailView(model);
								taskDetailView.render();
								window.loader.hide();
							}, onError);
						}, onError);
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
	var taskDetailsRouter = new TaskDetailsRouter;

})();