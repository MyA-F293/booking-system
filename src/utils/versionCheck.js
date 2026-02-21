// Auto-reload system for cache busting
// Detects new version and FORCES reload to prevent stale cache

const APP_VERSION = '2026.02.21.2127'; // Auto-updated by build script
const VERSION_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds (more frequent)

let versionCheckTimer = null;
let updateNotificationShown = false;
let forceReloadScheduled = false;

// Storage keys
const STORAGE_KEY = 'app_version';
const UPDATE_SHOWN_KEY = 'update_notification_shown';
const LAST_RELOAD_KEY = 'last_force_reload';

export const initVersionCheck = () => {
    const storedVersion = localStorage.getItem(STORAGE_KEY);
    const updateShown = sessionStorage.getItem(UPDATE_SHOWN_KEY);
    const lastReload = localStorage.getItem(LAST_RELOAD_KEY);
    const now = Date.now();

    console.log('🔍 Version Check:', {
        stored: storedVersion,
        current: APP_VERSION,
        lastReload: lastReload ? new Date(parseInt(lastReload)).toLocaleString() : 'never'
    });

    // First time - just store version
    if (!storedVersion) {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        localStorage.setItem(LAST_RELOAD_KEY, now.toString());
        console.log('✅ Version initialized:', APP_VERSION);
    } else if (storedVersion !== APP_VERSION && !updateShown) {
        // Version mismatch detected!
        console.log('🔄 Version mismatch detected! Forcing update...');
        console.log('   Old:', storedVersion);
        console.log('   New:', APP_VERSION);

        // Update stored version
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        localStorage.setItem(LAST_RELOAD_KEY, now.toString());

        // Mark notification as shown
        sessionStorage.setItem(UPDATE_SHOWN_KEY, 'true');
        updateNotificationShown = true;

        // FORCE UPDATE IMMEDIATELY
        handleVersionUpdate(true); // true = immediate force reload
    } else if (storedVersion === APP_VERSION) {
        console.log('✅ Version up to date:', APP_VERSION);
    }

    // Start periodic check for server updates
    startVersionCheck();

    // Unregister old service workers
    unregisterServiceWorkers();
};

const startVersionCheck = () => {
    if (versionCheckTimer) {
        clearInterval(versionCheckTimer);
    }

    versionCheckTimer = setInterval(() => {
        checkForUpdates();
    }, VERSION_CHECK_INTERVAL);

    // Also check immediately
    setTimeout(() => checkForUpdates(), 5000);
};

const checkForUpdates = async () => {
    if (updateNotificationShown || forceReloadScheduled) {
        return;
    }

    try {
        // Fetch version.json with aggressive cache busting
        const response = await fetch(`/version.json?t=${Date.now()}&r=${Math.random()}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const serverVersion = data.version;
            const currentVersion = APP_VERSION;

            if (serverVersion !== currentVersion && !updateNotificationShown) {
                console.log('🆕 New version on server:', serverVersion);
                console.log('   Current version:', currentVersion);

                // Update stored version
                localStorage.setItem(STORAGE_KEY, serverVersion);
                localStorage.setItem(LAST_RELOAD_KEY, Date.now().toString());

                // Mark as shown
                sessionStorage.setItem(UPDATE_SHOWN_KEY, 'true');
                updateNotificationShown = true;

                // FORCE UPDATE
                handleVersionUpdate(false); // false = show notification first
            }
        }
    } catch (error) {
        // Silent fail - normal if offline
        console.log('Version check skipped (offline or error)');
    }
};

const handleVersionUpdate = async (immediate = false) => {
    if (forceReloadScheduled) {
        return;
    }

    forceReloadScheduled = true;

    console.log('🧹 Clearing all caches...');

    // 1. Clear all browser caches
    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => {
                console.log('   Deleting cache:', name);
                return caches.delete(name);
            }));
            console.log('✅ All caches cleared');
        } catch (err) {
            console.error('Cache clear error:', err);
        }
    }

    // 2. Unregister service workers
    await unregisterServiceWorkers();

    // 3. Clear storage
    try {
        sessionStorage.clear();
        // Re-mark as shown after clearing
        sessionStorage.setItem(UPDATE_SHOWN_KEY, 'true');
        console.log('✅ Session storage cleared');
    } catch (err) {
        console.error('Storage clear error:', err);
    }

    // 4. Force reload
    if (immediate) {
        // Immediate reload without notification
        console.log('🔄 Forcing immediate reload...');
        setTimeout(() => {
            window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
        }, 500);
    } else {
        // Show notification then reload
        showUpdateNotification();
    }
};

const unregisterServiceWorkers = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                console.log('🗑️ Unregistering service worker:', registration.scope);
                await registration.unregister();
            }
            if (registrations.length > 0) {
                console.log('✅ All service workers unregistered');
            }
        } catch (err) {
            console.error('Service worker unregister error:', err);
        }
    }
};

const showUpdateNotification = () => {
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'version-update-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #1F4E8C 0%, #2a5fa3 100%);
            color: white;
            padding: 20px 28px;
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.4);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 20px;
            max-width: 90%;
            animation: slideDown 0.4s ease-out;
            border: 2px solid rgba(255,255,255,0.2);
        ">
            <div style="
                background: rgba(255,255,255,0.25);
                padding: 12px;
                border-radius: 12px;
                animation: spin 2s linear infinite;
            ">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                    <path d="M16 16h5v5"/>
                </svg>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 700; margin-bottom: 6px; font-size: 16px;">🎉 New Update Available!</div>
                <div style="font-size: 14px; opacity: 0.95;">Reloading in <span id="countdown">5</span> seconds...</div>
            </div>
            <button onclick="window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now()" style="
                background: white;
                color: #1F4E8C;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                font-weight: 700;
                cursor: pointer;
                font-size: 15px;
                transition: all 0.2s;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'">
                Reload Now
            </button>
        </div>
        <style>
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-120%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    // Remove existing notification
    const existing = document.getElementById('version-update-notification');
    if (existing) {
        existing.remove();
    }

    document.body.appendChild(notification);

    // Countdown timer
    let countdown = 5;
    const countdownEl = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdownEl) {
            countdownEl.textContent = countdown;
        }
        if (countdown <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    // Auto-reload after 5 seconds
    setTimeout(() => {
        console.log('🔄 Auto-reloading to apply updates...');
        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
    }, 5000);
};

export const stopVersionCheck = () => {
    if (versionCheckTimer) {
        clearInterval(versionCheckTimer);
        versionCheckTimer = null;
    }
};

export const getCurrentVersion = () => APP_VERSION;

// Force check for updates (can be called manually)
export const forceCheckUpdate = () => {
    console.log('🔍 Manual update check triggered');
    checkForUpdates();
};

// Clear all caches manually (for debugging)
export const clearAllCaches = async () => {
    console.log('🧹 Manual cache clear triggered');
    await handleVersionUpdate(true);
};
