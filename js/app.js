// Initializes Keycloak Single Sign-On (SSO), based on data in accompanying keycloak.json file;
var keycloak = Keycloak();
var userCredentials = null;
setTimeout(function () {
    keycloak.init({
        onLoad: 'login-required',
        flow: 'implicit'
    }).success(function (authenticated) {
        userCredentials = authenticated;
        $("#account").text(keycloak.subject);
    }).error(function (error) {
        alert('Failed to initialize authentication');
        console.log("Keycloak sign-in error");
        console.log(error);
    });
}, 1000);