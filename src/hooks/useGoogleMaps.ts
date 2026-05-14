import { useEffect, useState, useRef } from 'react';

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-script';

export function useGoogleMaps(apiKey: string) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key belum dikonfigurasi.');
      return;
    }

    // Already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Already loading
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          setIsLoaded(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places&language=id`;
    script.async = true;
    script.defer = true;

    script.onload = () => setIsLoaded(true);
    script.onerror = () => setError('Gagal memuat Google Maps. Periksa API key Anda.');

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount to avoid re-loading
    };
  }, [apiKey]);

  return { isLoaded, error };
}

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung geolocation.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        // Default to Jakarta if geolocation fails
        setLocation({ lat: -6.2088, lng: 106.8456 });
        setError('Lokasi tidak dapat diakses. Menampilkan lokasi default (Jakarta).');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, error, loading };
}
