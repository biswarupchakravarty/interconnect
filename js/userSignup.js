(function() {

    "use strict";

    var createSession = function () {
        var _sessionOptions = { "apikey": 'bv+E+hoO1NfVWx8eiC82YpAwozRN0SY+xMmko/2+Wc4=', app: 'shapeless' };
        Appacitive.session.create(_sessionOptions);
        Appacitive.eventManager.subscribe('session.success', function () {
            Appacitive.eventManager.fire('sessionCreated');
        });
    };
    createSession();

    var signupUser = function(onSuccess, onError) {
        Appacitive.facebook.requestLogin(function (fbResponse) {
            window.loader.show('Logging in to application');
            Appacitive.Users.signupWithFacebook(function (result) {
                window.loader.hide();
                Appacitive.session.setUserAuthHeader(result.token);
                window.user = result.user;
                onSuccess();
            }, onError);
        });
    };

    var onSessionCreated = function() {
        $('#lnkSigupWithFacebook').unbind('click').click(function() {
            window.loader.show('Contacting facebook');
            signupUser(function() {
                window.loader.hide();
                var user = window.user;
                $('#ulAnnonymousUser').hide();
                $('#ulLoggedInUser').show();
                $('#lblLoggedInUserName').html(user.firstname + ' ' + user.lastname);
                Appacitive.facebook.getCurrentUserInfo(function(u) {
                    var un = u.username;
                    var url = Appacitive.facebook.getProfilePictureUrl(un);
                    $('#imgFbPP').attr('src', url);
                });
                Appacitive.eventManager.fire('login.success', this, {});
                Backbone.history.navigate('', { trigger: true });
            }, function() {
                window.loader.hide();
            });
        });
    };

    if (!Appacitive.Users.getLinkedAccounts) {
        Appacitive.Users.getLinkedAccounts = function(userId, onSuccess, onError) {
            onSuccess = onSuccess || function(){};
            onError = onError || function(){};

            var request = new Appacitive.HttpRequest();
            request.url = Appacitive.config.apiBaseUrl + Appacitive.storage.urlFactory.user.getGetAllLinkedAccountsUrl(userId);
            request.method = 'get';
            request.onSuccess = function(d) {
                if (d && d.status && d.status.code && d.status.code == '200') {
                    onSuccess(d.identities);
                } else {
                    onError();
                }
            };
            request.onError = onError;
            Appacitive.http.send(request);
        };
    }

    Appacitive.eventManager.subscribe('session.success', function() {
        $(onSessionCreated);
    });

})();