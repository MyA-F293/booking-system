import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap, Wifi, Bell } from 'lucide-react';
import { setupInstallPrompt, showInstallPrompt, isInstalled } from '../utils/pwaHelpers';

const InstallPWA = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (isInstalled()) {
            setIsAppInstalled(true);
            return;
        }

        // Setup install prompt listener
        setupInstallPrompt((available) => {
            setShowPrompt(available);
        });

        // Check localStorage to see if user dismissed the prompt
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const now = new Date();
            const daysSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60 * 24);

            // Show again after 7 days
            if (daysSinceDismissed < 7) {
                setShowPrompt(false);
            }
        }
    }, []);

    const handleInstall = async () => {
        const accepted = await showInstallPrompt();
        if (accepted) {
            setShowPrompt(false);
            setIsAppInstalled(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
    };

    // Don't show if already installed or prompt not available
    if (isAppInstalled || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#1F4E8C]/20 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] p-4 relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                        <X size={16} className="text-white" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                            <img src="/eysa-logo.png" alt="EYSA" className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Install EYSA App</h3>
                            <p className="text-blue-100 text-xs">Get the best experience!</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-gray-700 text-sm mb-4">
                        Install our app for a faster, better experience with offline access!
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Zap size={16} className="text-blue-600" />
                            </div>
                            <span>Faster Loading</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Wifi size={16} className="text-green-600" />
                            </div>
                            <span>Offline Mode</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Smartphone size={16} className="text-purple-600" />
                            </div>
                            <span>Home Screen</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Bell size={16} className="text-orange-600" />
                            </div>
                            <span>Notifications</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors"
                        >
                            Not Now
                        </button>
                        <button
                            onClick={handleInstall}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            Install
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
