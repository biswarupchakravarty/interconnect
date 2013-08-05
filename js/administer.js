(function() {

	var AdminView = Backbone.View.extend({

		el: $('.content-container'),

		initialize: function() {
			this.render();
		},

		deleteProject: function() {
			var projectCollection = new Appacitive.ArticleCollection({ schema: 'project' });
			var project = projectCollection.createNewArticle();
			project.set('__id', window.project.__id);
			window.loader.show('Archiving project');
			project.fetch(function() {
				project.set('archived', 'true');
				project.save(function() {
					window.loader.show('Successfully archived project');
					window.loader.hide();
					window.loader.hide();
					Backbone.history.navigate('', { trigger: true });
				}, window.loader.hide);
			}, window.loader.hide);
		},

		quitProject: function() {
			var connections = new Appacitive.ConnectionCollection({ relation: 'member' });
			var connection = connections.createNewConnection();
			connection.set('__id', project.__connectionid);
			window.loader.show('Severing ties with ' + window.project.name);
			connection.del(function() {
				window.loader.hide();
				Backbone.history.navigate('', { trigger: true });
			}, function() {
				window.loader.hide();
				window.alert.show('Oops, there was an error trying to quit the project. You may have already quit the project. Press F5 to refresh the page and check.');
			});
		},

		sendInvite: function() {
			var sender = window.user.firstname + ' ' + window.user.lastname
			var url = window.location.protocol + window.location.hostname + window.location.pathname;
			var that = this, $modal = $('#inviteModal').modal();
			$modal.on('shown', function() {
				$('#txtInviteEmail').focus();
				$('#btnModalSendInvite').unbind('click').click(function() {
					var emailAddress = $('#txtInviteEmail').val();
					if (emailAddress && emailAddress.trim().length >= 0) {
						window.loader.show('Creating invite');
						var invites = new Appacitive.ArticleCollection({ schema: 'invite' });
						var invite = invites.createNewArticle();
						invite.set('sender', sender);
						invite.set('organizationid', window.project.__id);
						invite.set('organizationname', window.project.name);
						invite.save(function() {
							Appacitive.email.setupEmail({
								from: 'ssehgal@appacitive.com',
								frompassword: 'test123!@#'
							});
							window.loader.show('Sending invite to ' + emailAddress);
							var inviteId = invite.get('__id');
							url += '#messages/' + inviteId;
							Appacitive.email.sendRawEmail({
								to: [emailAddress],
								subject: 'Top Secret: Welcome to [Humara]',
								from: 'ssehgal@appacitive.com',
								frompassword: 'test123!@#',
								body: '<b>Greetings from [Humara]!</b><br>. You have been invited to join ' + window.project.name + ' by ' + sender + '. <a href="' + url + '">Click here</a> to join'
							}, window.loader.hide, window.loader.hide);
						}, window.loader.hide);
						$modal.modal('hide');
					}
				});
			});
		},
		
		bindEvents: function() {
			var that = this;
			$('#btnDeleteProject').unbind('click').click(that.deleteProject);
			$('#btnSendInvite').unbind('click').click(that.sendInvite);
			$('#btnQuitProject').unbind('click').click(that.quitProject);
		},

		render: function() {
			this.$el = $('.content-container').empty();

			$('.span3 > ul').hide();
			$('.project-menu').show();
			$('.span3 > ul > li').removeClass('active');
			$('#lnkAdminister').parent().addClass('active');
			
			var model = {
				name: window.project.name
			}
			var template = $('#tmplAdminister').html();
			var rendered = Mustache.render(template, model);
			var $element = $(rendered);
			this.$el.append($element);
			this.bindEvents();
		}

	});

	var AdminRouter = Backbone.Router.extend({

		routes: {
			'administer': 'administer'
		},

		administer: function() {
			if (window.user && window.user.__id) {
				var adminView = new AdminView;
			} else {
				Backbone.history.navigate('', { trigger: true });
			}
		}
	});
	var adminRouter = new AdminRouter;

})()