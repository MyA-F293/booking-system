// Lazy loading with retry and cache busting
// Handles "Failed to fetch dynamically imported module" errors

const lazyWithRetry = (componentImport) => {
    return new Promise((resolve, reject) => {
        // Check if window has already been refreshed
        const hasRefreshed = JSON.parse(
            window.sessionStorage.getItem('retry-lazy-refreshed') || 'false'
        );

        // Try to import the component
        componentImport()
            .then((component) => {
                window.sessionStorage.setItem('retry-lazy-refreshed', 'false');
                resolve(component);
            })
            .catch((error) => {
                if (!hasRefreshed) {
                    // Not refreshed yet
                    console.log('⚠️ Lazy loading failed, refreshing page...', error);
                    window.sessionStorage.setItem('retry-lazy-refreshed', 'true');

                    // Clear all caches before reload
                    if ('caches' in window) {
                        caches.keys().then(names => {
                            names.forEach(name => caches.delete(name));
                        });
                    }

                    // Reload page to get fresh files
                    return window.location.reload();
                }

                // Already refreshed, reject with error
                console.error('❌ Lazy loading failed after refresh:', error);
                reject(error);
            });
    });
};

export default lazyWithRetry;
