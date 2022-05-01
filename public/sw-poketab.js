const cacheName = 'chatmate-v5.5.0';
//Call Install Event
self.addEventListener('install', (e) => {
	console.log('Service Worker: Installed');
});

//Call Activate Event
self.addEventListener('activate', (e) => {
	console.log('Service Worker: Activated');

	//Remove Old Caches
	e.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cache => {
					if (cache !== cacheName){
						console.log('Service Worker: Clearing Old cache');
						return caches.delete(cache);
					}
				})
			);
		})
	);
});


//Call fetch event
self.addEventListener('fetch', e=> {
	console.log('Service Worker: Fetching');
	e.respondWith(
		fetch(e.request)
		.then(res => {
			const resClone = res.clone();
			caches.open(cacheName)
			.then(cache => {
				try{
					cache.put(e.request, resClone);
				}catch(err){
					console.log('Service Worker: Error Caching New Data');
				}
			});
			return res;
		}).catch(err => caches.match(e.request).then(res => res))
	);
});

/*
if (Notification.permission === 'granted'){
    alert("We have permission");
}
else if (Notification.permission !== 'denied'){
    Notification.requestPermission().then(permission => {
        console.log(permission);
        if (permission === 'granted'){
            console.log("We have permission");
        }
    });
}

//ask for notification permission
self.addEventListener('push', e => {
	console.log('Service Worker: Push Received [' + e.data.text() + ']');
	const data = e.data.json();
	self.registration.showNotification(data.title, {
		body: 'Notification from ' + data.name,
		icon: 'https://cdn.pixabay.com/photo/2016/11/18/23/38/child-1837375_960_720.png'
	});
});
*/
