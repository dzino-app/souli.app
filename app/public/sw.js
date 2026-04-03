const CACHE_NAME = "dzino-v1";

// Install — cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(["/", "/sk"]);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(event.request);
      })
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Dzino";
  const options = {
    body: data.body || "Máš novú správu!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — open app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});

// Background sync — for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-soul") {
    // Future: sync soul file changes when back online
  }
});

// Periodic background sync — for scheduled tasks
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "daily-check") {
    event.waitUntil(dailyCheck());
  }
});

async function dailyCheck() {
  // Check if should send reminder notifications
  const registration = self.registration;

  // "Dzino sa nudí" reminder after 2 days
  // This only works if periodic sync is granted by the browser
  await registration.showNotification("Dzino", {
    body: "Hej, už si dlho nebol. Chýbaš mi! 👋",
    icon: "/icons/icon-192.png",
    data: { url: "/" },
  });
}
