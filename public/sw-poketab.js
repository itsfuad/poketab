const cacheName = 'chatmate-v5.2.2';
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


