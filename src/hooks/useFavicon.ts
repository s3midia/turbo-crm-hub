import { useEffect } from 'react';
import { useSystemSettings } from './useSystemSettings';

/**
 * Hook to dynamically update the browser favicon based on system settings
 */
export function useFavicon() {
    const { data: settings } = useSystemSettings();

    useEffect(() => {
        const updateFavicon = () => {
            const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") ||
                document.createElement('link');

            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';

            if (settings?.logo_favicon) {
                link.href = settings.logo_favicon;
            } else {
                // Fallback to default
                link.href = '/logo.png';
            }

            document.getElementsByTagName('head')[0].appendChild(link);
        };

        updateFavicon();
    }, [settings?.logo_favicon]);
}
