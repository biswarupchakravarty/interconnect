(function() {

	var toAppacitiveDate = function(date) {
		var d = date.getDate(), m = date.getMonth() + 1, y = date.getFullYear();
		if (d < 10) d = '0' + d;
		if (m < 10) m = '0' + m;
		return y + '-' + m + '-' + d;
	}

	var controller = new (function() {

		this.createSprint = function(title, description, endDate, onSuccess, onError) {
			onSuccess = onSuccess || function(){};
			onError = onError || function(){};
			var today = new Date();
			var sprints = new Appacitive.ArticleCollection({ schema: 'sprint' });
			var sprint = sprints.createNewArticle({
				title: title,
				description: description,
				end: toAppacitiveDate(endDate),
				stages: 'New|Completed',
				start: toAppacitiveDate(today)
			});
			sprint.save(function() {
				var connectOptions = {
		            __endpointb: {
		                articleid: sprint.get('__id'),
		                label: 'sprint'
		            },
		            __endpointa: {
		                articleid: window.project.__id,
		                label: 'project'
		            }
		        };
		        var cC = new Appacitive.ConnectionCollection({ relation: 'contains' });
		        var connection = cC.createNewConnection(connectOptions);
		        connection.save(onSuccess, onError);
			}, onError);
		}

	})();

	var setupMenus = function() {
		$('.span3 > ul').hide();
		$('.menu-back').show();
		$('#lblMenuBackContents').html('Current Sprints');
		$('#lnkBack').unbind('click').click(function() {
			Backbone.history.navigate('sprints/current', { trigger: true });
		});
	}

	var CreateSprintView = Backbone.View.extend({

		initialize: function() {
			this.$el = $(document);
			this.render();
		},

		saveSprint: function(title, description, endDate) {
			window.loader.show('Creating sprint: "' + title + '"');
			controller.createSprint(title, description, endDate, function() {
				window.loader.hide();
				Backbone.history.navigate('sprints/current', { trigger: true });
			}, function() {
				window.loader.hide();
				window.alert.show('Oops, something does not feel right, could not save your sprint. Try again after a minute or two.');
			});
		},

		validate: function() {
			var title = $('#txtSprintTitle').val().trim()
			, description = $('#txtSprintDescription').val().trim()
			, endDate = new Date($('#txtSprintEndDate').val())
			, that = this;

			window.alert.hide();
			if (title.length == 0 || description.length == 0) {
				window.alert.show('Your sprint must have a title and a description.');
				if (title.length == 0) $('#txtSprintTitle').focus(); else $('#txtSprintDescription').focus();
			} else {
				that.saveSprint(title, description, endDate);
			}
		},

		setupStageParsing: function() {
			$('#txtSprintStages').unbind('keyup').keyup(function() {
				var list = ['New', 'Completed'];
				$('#lblParsedStages').html('<span class="label label-success" style="margin-left: 4px;">Completed</span>');
				var stages = $(this).val().trim().split(',');
				if (stages.length > 0) {
					var stage = stages.shift();
					list[0] = stage;
					var lastIndex = 1;
					while (stages.length > 0) {
						stage = stages.shift();
						if (stage.trim().length > 0)
							list.splice(lastIndex, 0, stage);
						lastIndex += 1;
					}
				}
				
				var htmlList = list.map(function (l, i) {
					var labelType = '';
					if (l.toLowerCase() == 'completed') labelType = 'label-success';
					if (i == 0) labelType = 'label-info';
					return '<span class="label ' + labelType + '" style="margin-left: 4px;">' + l + '</span>'; 
				});
				htmlList = '' + htmlList.join('') + '';
				$('#lblParsedStages').html(htmlList);
			});
		},

		render: function() {
			setupMenus();

			$container = $('.content-container').empty();
			var template = $('#tmplCreateSprint').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			var that = this;
			$container.append($element);

			$('#txtSprintTitle').focus();
			var today = new Date(), startDate = new Date(new Date().setDate(today.getDate() + 1));
			$('.date').datepicker({
				format: 'yyyy/mm/dd',
				startDate: startDate,
				autoclose: true
			}).datepicker('update', startDate);

			$('#btnCreateSprint').unbind('click').click(function() {
				that.validate.apply(that);
			});
		}

	});

	var CreateSprintRouter = Backbone.Router.extend({

		routes: {
			'sprints/create': 'createSprint'
		},

		createSprint: function() {
			var createSprintView = new CreateSprintView;
		}

	});
	var createSprintRouter = new CreateSprintRouter;

})();