(function() {

	var controller = new (function() {

		this.fetchSprint = function(id, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			var sprints = new Appacitive.ArticleCollection({ schema: 'sprint' });
			var sprint = sprints.createNewArticle();
			sprint.set('__id', id);
			sprint.fetch(function() {
				onSuccess(sprint.getArticle());
			}, onError);
		}

	})();

	var SprintSettingsView = Backbone.View.extend({

		initialize: function() {
			this.render();
		},

		previewStages: function(input) {
			var stages = ['New', 'Completed'];
			if (input && input.length > 0) {
				var tokens = input.split(',').map(function (t) { return t.trim(); });
				if (tokens.length == 1) {
					stages[0] = tokens[0];
				} else if (tokens.length > 1) {
					stages = tokens.concat(['Completed']);
				}
			}
			var html = '', className = '';
			stages = stages.filter(function (s) { return s.trim().length > 0 });
			stages.forEach(function (stage, index) {
				className = '';
				if (index == 0) className = 'label-info';
				if (index == stages.length - 1) className = 'label-success';
				html += '<span class="label ' + className + '">' + stage + '</span>&nbsp;';
			});
			$('#divStagesPreview').html(html).data('stages', stages);
		},

		saveChanges: function() {
			var stages = $('#divStagesPreview').data('stages');
			var sprints = new Appacitive.ArticleCollection({ schema: 'sprint' });
			var sprint = sprints.createNewArticle();
			sprint.set('__id', this.model.id);
			sprint.set('stages', stages.join('|'));
			
			var onError = function() {
				window.loader.hide();
				window.alert.hide();
				window.alert.show('Darn! Could not save your changes. Try again in a minute or you could contact support.');
			};

			window.loader.show('Updating sprint: "' + this.model.title + '"');
			sprint.fetch(function() {
				sprint.save(function() {
					window.loader.hide();
					Backbone.history.navigate('sprints/details/' + sprint.get('__id'), { trigger: true });
				}, onError);
			}, onError);
		},

		render: function() {
			this.$el = $('.content-container').empty();
			var template = $('#tmplSprintSettings').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			var that = this;
			this.$el.append($element);
			$('#txtSprintStages').unbind('keyup').keyup(function() {
				that.previewStages.apply(that, [$(this).val().trim()]);
			});
			$('#btnSaveChangesSprint').unbind('click').click(function() {
				that.saveChanges.apply(that, []);
			});
		}

	});

	var SprintSettingsRouter = Backbone.Router.extend({

		routes: {
			'sprints/:id/settings': 'settings'
		},

		settings: function(id) {
			if (false && Appacitive.session.get() == null && !Appacitive.Users.currentUser) {
				Backbone.history.navigate('', { trigger: true });
				return;
			}
			var onError = function() {
				window.loader.hide();
				window.alert.hide();
				window.alert.show('Hmmm, could not find the sprint requested. Either it has been deleted or you do not have permission to access it.');
			}
			window.loader.show('Loading sprint details');
			controller.fetchSprint(id, function(sprint) {
				window.loader.hide();
				window.alert.hide();
				var sprintSettingsView = new SprintSettingsView({ 
					model: { 
						name: sprint.title,
						id: sprint.__id
					}
				});
			}, onError)
		}
	});
	var sprintSettingsRouter = new SprintSettingsRouter;

})();