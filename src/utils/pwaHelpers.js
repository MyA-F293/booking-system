// PWA Helper Functions

/**
 * Register Service Worker with Auto-Reload on Update
 */
export const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('✅ Service Worker registered:', registration.scope);

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_UPDATED') {
                    console.log('🔄 New version detected, reloading...');
                    // Auto-reload after 1 second
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            });

            // Check for updates periodically (every 60 seconds)
            setInterval(() => {
                registration.update();
            }, 60000);

            // Check for updates on page visibility change
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    registration.update();
                }
            });

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Service Worker update found');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        console.log('✅ New version installed, will reload soon...');
                    }
                });
            });

            return registration;
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            return null;
        }
    } else {
        console.warn('⚠️ Service Workers not supported');
        return null;
    }
};

/**
 * Unregister Service Worker (for development/testing)
 */
export const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
        console.log('✅ Service Worker unregistered');
    }
};

/**
 * Check if app is installed (running as PWA)
 */
export const isInstalled = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
};

/**
 * Request Push Notification Permission
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

/**
 * Show Local Notification
 */
export const showNotification = async (title, options = {}) => {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
        console.warn('⚠️ Notification permission denied');
        return;
    }

    const defaultOptions = {
        icon: '/eysa-logo.svg',
        badge: '/eysa-logo.svg',
        vibrate: [200, 100, 200],
        ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Use service worker to show notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, defaultOptions);
    } else {
        // Fallback to regular notification
        new Notification(title, defaultOptions);
    }
};

/**
 * Subscribe to Push Notifications
 */
export const subscribeToPush = async () => {
    try {
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Get VAPID public key from environment
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('❌ VAPID public key not found');
                return null;
            }

            // Subscribe to push notifications
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });
        }

        console.log('✅ Push subscription:', subscription);
        return subscription;
    } catch (error) {
        console.error('❌ Push subscription failed:', error);
        return null;
    }
};

/**
 * Check if device is online
 */
export const isOnline = () => {
    return navigator.onLine;
};

/**
 * Listen for online/offline events
 */
export const setupConnectivityListeners = (onOnline, onOffline) => {
    window.addEventListener('online', () => {
        console.log('🌐 Back online');
        onOnline?.();
    });

    window.addEventListener('offline', () => {
        console.log('📴 Gone offline');
        onOffline?.();
    });
};

/**
 * Get install prompt event (for custom install button)
 */
let deferredPrompt = null;

export const setupInstallPrompt = (callback) => {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        console.log('📱 Install prompt available');
        callback?.(true);
    });

    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed');
        deferredPrompt = null;
        callback?.(false);
    });
};

/**
 * Show install prompt
 */
export const showInstallPrompt = async () => {
    if (!deferredPrompt) {
        console.warn('⚠️ Install prompt not available');
        return false;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Clear the deferredPrompt
    deferredPrompt = null;

    return outcome === 'accepted';
};

/**
 * Clear all caches (for development/testing)
 */
export const clearAllCaches = async () => {
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ All caches cleared');
    }
};

/**
 * Force update - Clear cache and reload
 * Call this from console: window.forceUpdate()
 */
export const forceUpdate = async () => {
    console.log('🔄 Forcing update...');

    // Unregister all service workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
            console.log('✅ Service Worker unregistered');
        }
    }

    // Clear all caches
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('✅ All caches cleared');
    }

    // Reload the page
    console.log('🔄 Reloading page...');
    window.location.reload(true);
};

// Make forceUpdate available globally for easy console access
if (typeof window !== 'undefined') {
    window.forceUpdate = forceUpdate;
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String) {
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

/**
 * Check PWA capabilities
 */
export const checkPWACapabilities = () => {
    return {
        serviceWorker: 'serviceWorker' in navigator,
        notifications: 'Notification' in window,
        pushManager: 'PushManager' in window,
        cacheStorage: 'caches' in window,
        indexedDB: 'indexedDB' in window,
        backgroundSync: 'sync' in ServiceWorkerRegistration.prototype,
        periodicSync: 'periodicSync' in ServiceWorkerRegistration.prototype
    };
};

export default {
    registerServiceWorker,
    unregisterServiceWorker,
    isInstalled,
    requestNotificationPermission,
    showNotification,
    subscribeToPush,
    isOnline,
    setupConnectivityListeners,
    setupInstallPrompt,
    showInstallPrompt,
    clearAllCaches,
    checkPWACapabilities
};
