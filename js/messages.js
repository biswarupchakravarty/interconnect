(function() {

	var setupMenus = function() {
		$('.span3 > ul').hide();
		$('.project-menu').show();
		$('.actions-menu').show();
		$('.span3 > ul > li').removeClass('active');
		$('#lnkMessages').parent().addClass('active');
		$('.subsection').hide();
	}

	var setupMenusForDetails = function() {
		$('.span3 > ul').hide();
		$('.menu-back').show();
		$('#lblMenuBackContents').html('Home')
		$('#lnkBack').unbind('click').click(function() {
			Backbone.history.navigate('', { trigger: true });
		});
	}

	var acceptInvite = function() {
		signUpUser(function() {
			Backbone.history.navigate('', { trigger: true });
		}, function() {
			window.alert.show('Oops, something went wrong either while trying to sign you up or while accepting the invitation. This could be because you have already accepted the invitation or you already are a member of the project you are being invited to.');
		});
	}

	var signUpUser = function(onSuccess, onError) {
		Appacitive.facebook.requestLogin(function (fbResponse) {
		    window.loader.show('Logging in to application');
		    Appacitive.Users.signupWithFacebook(function (result) {
		        window.loader.hide();
		        Appacitive.session.setUserAuthHeader(result.token);
		        window.user = result.user;
		        createMember(onSuccess, onError);
		    }, function() {
		    	window.loader.hide();
		    	(onError || function(){})();
		    });
		});
	}

	var createMember = function(onSuccess, onError) {
		window.loader.show('Accepting invitation');
		var userId = window.user.__id;
		var projectId = window.invite.organizationid;
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
	    connection.set('creator', 'false');
	    connection.set('admin', 'false');

	    connection.save(function () {
	    	window.loader.hide();
	        if (onSuccess && typeof onSuccess == 'function')
	        	onSuccess();
	        deleteInvite();
	    }, function () {
	    	window.loader.hide();
	        (onError || function() {
    	    	window.alert.show('Oops, something went wrong either while trying to sign you up or while accepting the invitation. This could be because you have already accepted the invitation or you already are a member of the project you are being invited to.');
	        })(arguments);
	    });
	};

	var deleteInvite = function() {
		window.loader.show('Marking invitation as accepted.');
		var invites = new Appacitive.ArticleCollection({ schema: 'invite' });
		var invite = invites.createNewArticle();
		invite.set('__id', getMessageIdFromUrl());
		invite.del(function() {
			window.loader.hide();
			Backbone.history.navigate('', { trigger: true });
		}, function() {
			window.loader.hide();
			alert('An error occured, try refreshing the page...');
		});
	};

	var MessagesView = Backbone.View.extend({

		initialize: function() {
			this.render();
		},

		render: function() {
			setupMenus();
			this.$el = $('.content-container').empty();

			// render the container
			var template = $('#tmplMessagesListing').html();
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			
			// render the messages
			var messageTemplate = $('#tmplMessageListingRow').html();
			var renderedRow = Mustache.render(messageTemplate, {});
			var res = ''
			for (var x=0;x<25;x++) {
				var renderedRow1 = renderedRow;
				renderedRow = renderedRow.replace((x+1)+'', (x+2)+'');
				if (parseInt(Math.random() * 100) % 6 != 0) renderedRow1 = renderedRow1.replace(/success/, '');
				else renderedRow1 = renderedRow1.replace('info', 'success');
				renderedRow = renderedRow.replace((x+1)+'.', (x+2)+'.');
				res += renderedRow1;
			}

			$('.open-message-details').die('click').live('click', function() {
				var messageId = $(this).attr('data-messageid');
				Backbone.history.navigate('messages/' + messageId, { trigger: true });
			});

			$('#tblMessagesListing', $element).html(res);

			// attach the element
			this.$el.append($element);

			return this;
		}

	});

	var InviteDetailsView = Backbone.View.extend({

		initialize: function(d) {
			this.render();
		},

		render: function() {
			setupMenusForDetails();
			this.$el = $('.content-container').empty();

			// render the container
			var template = $('#tmplInviteDetails').html();
			this.model.invitedate = function() {
				return new Date(this.__utcdatecreated).toLocaleDateString();
			}
			var rendered = Mustache.render(template, this.model);
			var $element = $(rendered);
			$('a[rel="popover"]', $element).popover({
				placement: 'bottom'
			});

			// attach the element
			this.$el.append($element);

			$('.btn-delete-invite').unbind('click').click(deleteInvite);
			$('.btn-accept-invite').unbind('click').click(createMember);
			$('.btn-signup-invite').unbind('click').click(acceptInvite);

			window.loader.hide();
		}

	});

	var getMessageIdFromUrl = function() {
		var url = Backbone.history.getHash();
		var startIndex = url.indexOf('messages/');
		var messageId = url.substr(startIndex + 'messages/'.length, url.length - startIndex);
		return messageId;
	}

	eventId = null;

	var MessagesRouter = Backbone.Router.extend({

		routes: {
			'messages': 'listing',
			'messages/:id': 'details'
		},

		listing: function() {
			if (typeof clearEventSubscriptions == 'function') clearEventSubscriptions();
			window.loader.show('Loading messages');
			setTimeout(function() {
				var messages = new MessagesView;
				window.loader.hide();
			}, 1000);
		},

		details: function(id) {
			if (eventId != null)
				Appacitive.eventManager.unsubscribe(eventId);

			var messageId = getMessageIdFromUrl();
			window.loader.show('Fetching invitation #' + messageId);

			var invites = new Appacitive.ArticleCollection({ schema: 'invite' });
			var invite = invites.createNewArticle();
			var inviteModel = {};
			var fetchAndRenderInvite = function(step) {
				invite.fetch(function() {
					inviteModel = invite.getArticle();
					inviteModel.loggedIn = window.user != undefined;
					inviteModel.inviteExists = true;
					inviteModel.canSee = inviteModel.loggedIn && inviteModel.inviteExists;
					window.invite = invite.getArticle();
					var view = new InviteDetailsView({ model: inviteModel })
				}, function() { 
					inviteModel.loggedIn = true;
					inviteModel.noInvite = true;
					inviteModel.inviteExists = false;
					var view = new InviteDetailsView({ model: inviteModel }); 
				});
			}
			invite.set('__id', getMessageIdFromUrl());
			if (Appacitive.session.get() != null) fetchAndRenderInvite();
			else eventId = Appacitive.eventManager.subscribe('session.success', fetchAndRenderInvite);
		}

	});
	var messagesRouter = new MessagesRouter;

})();