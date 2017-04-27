self.addEventListener('push', event => {
    let promiseChain;
    if (event.data) {
        // We have data - lets use it
        promiseChain = Promise.resolve(event.data.json());
    } else {
        promiseChain = fetch('/some/data/endpoint.json')
            .then(response => response.json());
    }

    promiseChain = promiseChain.then(data => {
        return self.registration.showNotification(data.title, data);
    });
    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', event => {
    // Do something with the event  
    event.notification.close();
});

self.addEventListener('notificationclose', event => {
    // Do something with the event  
});
