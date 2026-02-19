// Auto-reload system for cache busting
// Detects new version and prompts user to reload

const APP_VERSION = '2026.02.19.1223'; // Update this when deploying new version
const VERSION_CHECK_INTERVAL = 1 * 60 * 1000; // Check every 1 minute

let versionCheckTimer = null;
let updateNotificationShown = false; // Flag to prevent repeated notifications

// Store version in localStorage
const STORAGE_KEY = 'app_version';
const UPDATE_SHOWN_KEY = 'update_notification_shown';

export const initVersionCheck = () => {
    const storedVersion = localStorage.getItem(STORAGE_KEY);
    const updateShown = sessionStorage.getItem(UPDATE_SHOWN_KEY);

    // First time - just store version
    if (!storedVersion) {
        localStorage.setItem(STORAGE_KEY, APP_VERSION);
        console.log('✅ Version initialized:', APP_VERSION);
    } else if (storedVersion !== APP_VERSION && !updateShown) {
        // Version mismatch and notification not shown yet
        console.log('🔄 Version mismatch detected:', { stored: storedVersion, current: APP_VERSION });

        // Update stored version immediately to prevent repeated checks
        localStorage.setItem(STORAGE_KEY, APP_VERSION);

        // Mark notification as shown in this session
        sessionStorage.setItem(UPDATE_SHOWN_KEY, 'true');
        updateNotificationShown = true;

        // Show notification
        handleVersionUpdate();
    } else if (storedVersion === APP_VERSION) {
        console.log('✅ Version up to date:', APP_VERSION);
    }

    // Start periodic check (only for server updates)
    startVersionCheck();
};

const startVersionCheck = () => {
    if (versionCheckTimer) {
        clearInterval(versionCheckTimer);
    }

    versionCheckTimer = setInterval(() => {
        checkForUpdates();
    }, VERSION_CHECK_INTERVAL);
};

const checkForUpdates = async () => {
    // Don't check if notification already shown in this session
    if (updateNotificationShown) {
        return;
    }

    try {
        // Fetch version.json from server with cache-busting
        const response = await fetch(`/version.json?t=${Date.now()}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const serverVersion = data.version;
            const currentVersion = APP_VERSION;

            // Only show notification if server version is different from current
            if (serverVersion !== currentVersion && !updateNotificationShown) {
                console.log('🆕 New version available on server:', serverVersion);

                // Update stored version
                localStorage.setItem(STORAGE_KEY, serverVersion);

                // Mark notification as shown
                sessionStorage.setItem(UPDATE_SHOWN_KEY, 'true');
                updateNotificationShown = true;

                handleVersionUpdate();
            }
        }
    } catch (error) {
        console.log('Version check failed (normal if offline):', error.message);
    }
};

const handleVersionUpdate = () => {
    // Don't show notification if already shown
    if (updateNotificationShown) {
        return;
    }

    // Clear all caches aggressively
    if ('caches' in window) {
        caches.keys().then(names => {
            names.forEach(name => {
                console.log('🗑️ Deleting cache:', name);
                caches.delete(name);
            });
        });
    }

    // Clear session storage (for lazy loading retry)
    window.sessionStorage.clear();

    // Re-mark as shown after clearing session storage
    sessionStorage.setItem(UPDATE_SHOWN_KEY, 'true');

    // Show update notification
    showUpdateNotification();
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
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 16px;
            max-width: 90%;
            animation: slideDown 0.3s ease-out;
        ">
            <div style="
                background: rgba(255,255,255,0.2);
                padding: 8px;
                border-radius: 8px;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                    <path d="M16 16h5v5"/>
                </svg>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">New Update Available!</div>
                <div style="font-size: 13px; opacity: 0.9;">Please reload to get the latest version</div>
            </div>
            <button onclick="window.location.reload(true)" style="
                background: white;
                color: #1F4E8C;
                border: none;
                padding: 8px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Reload Now
            </button>
        </div>
        <style>
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
        </style>
    `;

    // Remove existing notification if any
    const existing = document.getElementById('version-update-notification');
    if (existing) {
        existing.remove();
    }

    document.body.appendChild(notification);

    // Auto-reload after 10 seconds if user doesn't click
    setTimeout(() => {
        console.log('🔄 Auto-reloading to apply updates...');
        window.location.reload(true);
    }, 10000);
};

export const stopVersionCheck = () => {
    if (versionCheckTimer) {
        clearInterval(versionCheckTimer);
        versionCheckTimer = null;
    }
};

export const getCurrentVersion = () => APP_VERSION;
