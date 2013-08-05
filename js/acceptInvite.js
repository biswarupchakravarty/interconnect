(function() {

	var Invite = Backbone.Model.extend({
		defaults: function() {
			return {
				sender_name: 'Biswarup Chakrav`1arty',
				sender_organization: 'Appacitive',
				sender_email: 'biswarup.chakravarty@appacitive.com',
				receiver_name: 'CrazyKoder&trade;',
				organization_id: 12345
			};
		},

		parse: function(raw) {
			var parsed = JSON.parse(window.atob(raw));
			this.set('sender_name', parsed.sender_name);
			this.set('sender_email', parsed.sender_email);
			this.set('sender_organization', parsed.sender_organization);
			this.set('receiver_name', parsed.receiver_name);
			this.set('organization_id', parsed.organization_id);
		}
	});

	var InviteView = Backbone.View.extend({

		el: $('div.content-container'),

		render: function() {
			this.$el = $('div.content-container').empty();
			var $modal = $(Mustache.render($('#tmplAcceptInvite').html(), this.model.attributes));
			$(document.body).append($modal);
			$modal.modal();
			return $modal;
		}

	});

	AcceptInviteRouter = Backbone.Router.extend({
		
		routes: {
			'invites/accept/:content': 'acceptInvite'
		},

		acceptInvite: function(content) {
			var testSample = {
				sender_name: 'Biswarup Chakravarty',
				sender_organization: 'Appacitive',
				sender_email: 'biswarup.chakravarty@appacitive.com',
				receiver_name: 'CrazyKoder&trade;',
				organization_id: 12345
			};
			var invite = new Invite;
			var encoded = window.btoa(JSON.stringify(testSample));
			Backbone.history.navigate('invites/accept/' + encoded);
			invite.parse(encoded);
			var inviteViewModal = new InviteView({ model: invite }).render();
			inviteViewModal.on('hide', function () {
				Backbone.history.navigate('', {trigger: true});
			});
		}
	});
	var acceptInviteRouter = new AcceptInviteRouter;

})();