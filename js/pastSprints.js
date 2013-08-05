(function() {
	var Sprint = Backbone.Model.extend({
		defaults: function() {
			return {
				id: parseInt(Math.random() * 100000),
				name: 'Sprint #' + parseInt(Math.random() * 100),
				started: new Date().getTime() - (60 * 24 * 3600 * 1000),
				ending: new Date().getTime() - (30 * 24 * 3600 * 1000),
				tasksTotal: 19
			};
		}
	});

	var SprintSummaryView = Backbone.View.extend({

		tagName: 'tr',

		className: function() {
			return this.model.get('allDone') ? '' : 'error';
		},

		render: function() {
			this.template = $('#tmplPastSprintSummary').html();
			var model = JSON.parse(JSON.stringify(this.model.attributes));
			model.ended = parseInt((new Date().getTime() - model.ending) / (24 * 3600 * 1000));
			model.tasksLeft = model.tasksTotal - model.tasksDone;
			if (model.ended == 0 || model.ended == 1) { model.ended = 'Yesterday'; } else { model.ended += ' days ago'; }
			if (model.allDone) {
				model.percentageDone = 100;
			} else {
				model.percentageDone = (model.tasksDone * 100 / model.tasksTotal).toFixed(2);
			}
			model.percentageLeft = parseInt(100 - model.percentageDone);
			this.$el.html(Mustache.render(this.template, model));
			this.$el.find('a.toggle-popover-user').popover({
				placement: 'bottom',
				html: true,
				trigger: 'hover'
			});
			var sprintId = model.id;
			this.$el.find('button.btn-sprint-details').click(function() {
				window.previousLocation = Backbone.history.getHash();
				Backbone.history.navigate('sprints/details/' + sprintId, { trigger: true });
			});
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

	var SprintCollection = Backbone.Collection.extend({
		model: Sprint,

		comparator: function(u) {
			return 0 - u.get('ending');
		}
	});

	var sprints = new SprintCollection;

	var PastSprintListingView = Backbone.View.extend({

		el: $('div.content-container'),

		sprintSummaryViews: [],

		events: {
			'keyup input#pastSprintSearch': 'sprintSearch'
		},

		sprintSearch: function(e) {
			var searchString = this.$el.find('input#pastSprintSearch').val();
			this.sprintSummaryViews.forEach(function(usv) {
				usv.applySearch(searchString);
			});
		},

		initialize: function() {
			this.$el = $('div.content-container');
			this.render();
		},

		render: function() {
			this.$el = $('div.content-container');
			this.$el.empty().append($($('#tmplPastSprintListing').html()));
			var $container = $('#pastSprintsContainer').empty(), that = this;
			sprints.each(function(user, index) {
				user.set('alternate', index % 2 == 1);
				user.set('index', index + 1);
				var sprintSummaryView = new SprintSummaryView({ model: user });
				$container.append(sprintSummaryView.render().$el);
				that.sprintSummaryViews.push(sprintSummaryView);
			});
		}
	});

	var SprintRouter = Backbone.Router.extend({
		routes: {
			'sprints/past': 'sprints',
		},

		initialize: function() {
			for (var t = 0; t < 23; t += 1) {
				var s = new Sprint;
				var duration = parseInt(Math.random() * 14);
				s.set('started', parseInt(s.get('started') + (Math.random() * 46 * 24 * 3600 * 1000)));
				s.set('ending', s.get('started') + (duration * 24 * 3600 * 1000));
				s.set('tasksTotal', parseInt(Math.random() * duration) + 10);
				s.set('championFull', 'DeepClone #' + parseInt(Math.random() * 10000));
				s.set('champion', s.get('championFull').substr(0, 9) + '...');
				var allDone = (s.get('tasksTotal') % 6) != 0;
				s.set('tasksDone', allDone ? s.get('tasksTotal') : parseInt(Math.random() * s.get('tasksTotal')));
				s.set('allDone', allDone);
				sprints.add(s);
			}
			$(function() {
				$('#badgePastSprints').html(sprints.length);
			});

			// add to global sprint listing
			if (!window.sprints) window.sprints = [];
			window.sprints = window.sprints.concat(sprints);
		},

		sprints: function() {
			$('ul.bs-docs-sidenav.main-menu').show();
			$('.menu-back').hide();
			$('ul.bs-docs-sidenav.sprint-details-menu').hide();
			$('ul.bs-docs-sidenav.task-details-menu').hide();
			if (window.modal) window.modal.modal('hide');
			$('.nav-options	> li').removeClass('active');
			$('#pastSprintsMenuItem').addClass('active');
			var sprintListing = new PastSprintListingView;
		}

	});
	var sprintRouter = new SprintRouter;

	$(function() {
		$('#pastSprintsMenuItem').click(function() {
			sprintRouter.navigate('sprints/past', { trigger: true });
		});
	});

})();