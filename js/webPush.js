var tla;
if (tla == null)
    tla = {};
if (tla.launchy == null)
    tla.launchy = {}

tla.launchy.applicationServerPublicKey = "BL3zy24rM6kH_y-usD4_Tz01C4V9_1OfbQI1YbZMjejWgbrTDK2Nk_7VnmKMgN_5N0wfBy8udvDAisQpWj0lzJE";
tla.launchy.subscription = null;
tla.launchy.baseUrl = "https://cass.tla.cassproject.org/launch";

tla.launchy.initialize = function () {
    if (Notification.permission !== 'granted') {
        $(".notSubscribed").show();
        $(".subscribed").hide();
        return;
    } else if (Notification.permission === "blocked") {
        $(".blocked").show();
        $(".notSubscribed").hide();
        $(".notSubscribed").hide();
    } else {
        $(".notSubscribed").hide();
        $(".subscribed").show();
    }

    // Use serviceWorker.ready so this is only invoked
    // when the service worker is available.
    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription()
            .then(function (subscription) {
                if (!subscription) {
                    $(".notSubscribed").show();
                    $(".subscribed").hide();
                } else {
                    $(".notSubscribed").hide();
                    $(".subscribed").show();
                    return tla.launchy.refreshDetails(subscription);
                }
            })
            .catch(function (err) {
                console.log('Error during service worker initialization()', err);
            });
    });
}

tla.launchy.send = function (message) {
    message.subject = keycloak.subject;
    return $.ajax({
        url: tla.launchy.baseUrl + '/send',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(message)
    });
}

tla.launchy.refreshDetails = function (subscription) {
    var sub = subscription;
    if (sub.toJSON !== undefined) sub = sub.toJSON();
    sub.subject = keycloak.subject;
    $.ajax({
        url: tla.launchy.baseUrl + '/devices',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(sub),
        success: function (success) {
            $("#deviceCount").text(JSON.parse(success).length);
        }
    });
    return $.ajax({
        url: tla.launchy.baseUrl + '/whoAmI',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(sub),
        success: function (success) {
            $("#deviceOwnerId").text(success == keycloak.subject ? "You." : "Someone else. Please unsubscribe and resubscribe.");
        }
    });
}

tla.launchy.subscribe = function () {
    if (ServiceWorkerRegistration.showNotification != null) {
        navigator.serviceWorker.ready
            .then(registration => {
                return registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: tla.launchy.urlBase64ToUint8Array(tla.launchy.applicationServerPublicKey)
                });
            })
            .then(subscription => {
                tla.launchy.subscription = subscription;
                console.log(subscription);
                $(".notSubscribed").hide();
                $(".subscribed").show();
                var registration = subscription.toJSON();
                registration.subject = keycloak.subject;
                return $.ajax({
                    url: tla.launchy.baseUrl + '/register',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(registration),
                    success: function (success) {
                        tla.launchy.refreshDetails(registration);
                    }
                });
            })
            .catch(error => {
                console.log('Error during subscribe()', error);
            });
    }
}

tla.launchy.unsubscribe = function () {
    ServiceWorkerRegistration.pushManager.getSubscription()
        .then(function (subscription) {
            if (subscription) {
                return $.ajax({
                    url: tla.launchy.baseUrl + '/unregister',
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(subscription),
                    success: function (success) {
                        $(".notSubscribed").hide();
                        $(".subscribed").hide();
                        setTimeout(function () {
                            subscription.unsubscribe();
                            $(".notSubscribed").show();
                            $(".subscribed").hide();
                        }, 1000);
                    }
                });
            }
        })
        .catch(function (error) {
            console.log('Error unsubscribing', error);
        })
        .then(function () {
            //updateSubscriptionOnServer(null);

            console.log('User is unsubscribed.');
            isSubscribed = false;

        });
}


tla.launchy.bindServiceWorker = function () {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push is supported');

        navigator.serviceWorker.register('pushServiceWorker.js')
            .then(function (swReg) {
                console.log('Service Worker is registered', swReg);

                ServiceWorkerRegistration = swReg;
                tla.launchy.initialize();
            })
            .catch(function (error) {
                console.error('Service Worker Error', error);
                $(".blocked").show().text("Error: " + error.message);
            });
    } else {
        console.warn('Push messaging is not supported');
        pushButton.textContent = 'Push Not Supported';
    }
}


tla.launchy.urlBase64ToUint8Array = function (base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
