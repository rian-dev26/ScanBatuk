import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Hospital, Pill, Building2, Navigation, Star, Clock, Phone, ArrowLeft, Loader2, AlertCircle, X } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleMaps, useUserLocation } from '../hooks/useGoogleMaps';
import { cn } from '../lib/utils';
import { useTheme } from '../contexts/ThemeContext';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface PlaceResult {
  id: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  distance?: string;
  isOpen?: boolean;
  phone?: string;
  lat: number;
  lng: number;
  types: string[];
  icon: string;
}

const SEARCH_CATEGORIES = [
  { label: 'Rumah Sakit', query: 'rumah sakit', icon: Hospital, color: 'var(--color-brand-pink)' },
  { label: 'Apotek', query: 'apotek pharmacy', icon: Pill, color: 'var(--color-brand-mint)' },
  { label: 'Klinik', query: 'klinik kesehatan', icon: Building2, color: 'var(--color-brand-lavender)' },
  { label: 'Puskesmas', query: 'puskesmas', icon: Building2, color: 'var(--color-brand-ochre)' },
];

export default function NearbyPage() {
  const { user } = useAuth();
  const { isLoaded, error: mapsError } = useGoogleMaps(API_KEY);
  const { location: userLocation, error: locError, loading: locLoading } = useUserLocation();
  const { isDark } = useTheme();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [customQuery, setCustomQuery] = useState('');

  // Map styles based on theme
  const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];

  const lightMapStyle = [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setOptions({ styles: isDark ? darkMapStyle : lightMapStyle });
    }
  }, [isDark]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !userLocation || !mapRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 14,
      styles: isDark ? darkMapStyle : lightMapStyle,
      disableDefaultUI: true,
      zoomControl: true,
      fullscreenControl: true,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // User location marker
    new google.maps.Marker({
      position: userLocation,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#0a0a0a',
        fillOpacity: 1,
        strokeColor: '#fffaf0',
        strokeWeight: 3,
      },
      title: 'Lokasi Anda',
      zIndex: 999,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isLoaded, userLocation, isDark]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  const searchNearby = useCallback(async (queryText: string, categoryLabel?: string) => {
    if (!mapInstanceRef.current || !userLocation) return;

    setSearching(true);
    setActiveCategory(categoryLabel || queryText);
    setSelectedPlace(null);
    clearMarkers();

    try {
      const service = new google.maps.places.PlacesService(mapInstanceRef.current);
      
      const request = {
        query: queryText,
        location: userLocation,
        radius: 5000,
      };

      service.textSearch(request, (results, status) => {
        setSearching(false);
        
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          setPlaces([]);
          return;
        }

        const mapped: PlaceResult[] = results.slice(0, 15).map((p) => {
          const lat = p.geometry?.location?.lat() || 0;
          const lng = p.geometry?.location?.lng() || 0;
          const dist = getDistanceKm(userLocation.lat, userLocation.lng, lat, lng);

          return {
            id: p.place_id || Math.random().toString(),
            name: p.name || 'Tidak diketahui',
            address: p.formatted_address || '',
            rating: p.rating,
            totalRatings: p.user_ratings_total,
            distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`,
            isOpen: p.opening_hours?.isOpen?.() ?? undefined,
            lat,
            lng,
            types: p.types || [],
            icon: '',
          };
        });

        // Sort by distance
        mapped.sort((a, b) => {
          const da = getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng);
          const db = getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng);
          return da - db;
        });

        setPlaces(mapped);

        // Add markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));

        mapped.forEach((place, i) => {
          const marker = new google.maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map: mapInstanceRef.current!,
          title: place.name,
          label: { text: `${i + 1}`, color: '#fff', fontSize: '11px', fontWeight: 'bold' },
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
            fillColor: '#0a0a0a',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            scale: 1.5,
            anchor: new google.maps.Point(12, 22),
            labelOrigin: new google.maps.Point(12, 10),
          },
        });

        marker.addListener('click', () => {
          setSelectedPlace(place);
          mapInstanceRef.current?.panTo({ lat: place.lat, lng: place.lng });
          mapInstanceRef.current?.setZoom(16);
          
          // Buka di Google Maps
          const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}&query_place_id=${place.id}`;
          window.open(url, '_blank');
        });

          markersRef.current.push(marker);
          bounds.extend(new google.maps.LatLng(place.lat, place.lng));
        });

        mapInstanceRef.current?.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      });
    } catch (error) {
      console.error("Error searching places:", error);
      setSearching(false);
      setPlaces([]);
    }
  }, [userLocation]);

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      searchNearby(customQuery.trim());
    }
  };

  const openDirections = (place: PlaceResult) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${place.id}`;
    window.open(url, '_blank');
  };

  if (!user) return <Navigate to="/login" replace />;

  // No API key configured
  if (!API_KEY) {
    return (
      <div className="max-w-4xl mx-auto w-full pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-medium mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Lokasi Fasilitas Kesehatan</h1>
        </div>
        <div className="rounded-3xl p-12 text-center" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-brand-ochre)', opacity: 0.2 }}>
            <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-warning)' }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-ink)' }}>API Key Belum Dikonfigurasi</h3>
          <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--text-muted)' }}>
            Tambahkan <code className="px-2 py-0.5 rounded font-mono text-xs" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-ink)' }}>VITE_GOOGLE_MAPS_API_KEY</code> ke file <code className="px-2 py-0.5 rounded font-mono text-xs" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-ink)' }}>.env</code> Anda.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aktifkan Maps JavaScript API dan Places API di Google Cloud Console.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-medium mb-2" style={{ color: 'var(--text-ink)', letterSpacing: '-0.025em' }}>Lokasi Fasilitas Kesehatan</h1>
        <p style={{ color: 'var(--text-muted)' }}>Temukan rumah sakit, apotek, dan klinik terdekat dari lokasi Anda.</p>
      </div>

      {/* Location warning */}
      {locError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 text-sm font-medium" style={{ backgroundColor: 'var(--bg-error-light)', border: '1px solid var(--border-error)', color: 'var(--text-error-strong)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" /> {locError}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleCustomSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Cari lokasi... (contoh: apotek 24 jam, rumah sakit paru)"
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:ring-1 focus:outline-none"
            style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)', color: 'var(--text-ink)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--text-ink)'; e.currentTarget.style.boxShadow = '0 0 0 1px var(--text-ink)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </form>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SEARCH_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => searchNearby(cat.query, cat.label)}
              disabled={searching || !isLoaded}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                (searching || !isLoaded) && 'opacity-50 cursor-not-allowed'
              )}
              style={
                isActive
                  ? { backgroundColor: 'var(--text-ink)', color: 'var(--bg-canvas)', borderColor: 'var(--text-ink)' }
                  : { backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
              }
              onMouseEnter={e => { if (!isActive && !searching && isLoaded) { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-ink)'; } }}
              onMouseLeave={e => { if (!isActive && !searching && isLoaded) { e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
            {!isLoaded || locLoading ? (
              <div className="h-[450px] flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-soft)' }}>
                <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {locLoading ? 'Mendapatkan lokasi Anda...' : 'Memuat Google Maps...'}
                </p>
              </div>
            ) : mapsError ? (
              <div className="h-[450px] flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: 'var(--bg-soft)' }}>
                <AlertCircle className="w-8 h-8 mb-4" style={{ color: 'var(--color-error)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{mapsError}</p>
              </div>
            ) : (
              <div ref={mapRef} className="h-[450px] w-full" />
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl overflow-hidden h-[450px] flex flex-col" style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-ink)' }}>
                {activeCategory ? `Hasil: ${activeCategory}` : 'Pilih kategori untuk mencari'}
              </h3>
              {places.length > 0 && (
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{places.length} ditemukan</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {searching ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Mencari...</p>
                </div>
              ) : places.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--bg-card)' }}>
                    <MapPin className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {activeCategory ? 'Tidak ada hasil ditemukan.' : 'Pilih kategori di atas untuk mencari fasilitas kesehatan terdekat.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ divideColor: 'var(--border-soft)' }}>
                  {places.map((place, i) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        setSelectedPlace(place);
                        mapInstanceRef.current?.panTo({ lat: place.lat, lng: place.lng });
                        mapInstanceRef.current?.setZoom(16);
                        
                        // Buka di Google Maps
                        const url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}&query_place_id=${place.id}`;
                        window.open(url, '_blank');
                      }}
                      className={cn(
                        'w-full text-left px-5 py-4 transition-colors'
                      )}
                      style={selectedPlace?.id === place.id ? { backgroundColor: 'var(--bg-selected)' } : {}}
                      onMouseEnter={e => { if (selectedPlace?.id !== place.id) e.currentTarget.style.backgroundColor = 'var(--bg-card)'; }}
                      onMouseLeave={e => { if (selectedPlace?.id !== place.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'var(--text-ink)', color: 'var(--bg-canvas)' }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-ink)' }}>{place.name}</p>
                          <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>{place.address}</p>
                          <div className="flex items-center gap-3 mt-2">
                            {place.rating && (
                              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-warning)' }}>
                                <Star className="w-3 h-3 fill-current" /> {place.rating}
                                {place.totalRatings && <span style={{ color: 'var(--text-muted)' }}>({place.totalRatings})</span>}
                              </span>
                            )}
                            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{place.distance}</span>
                            {place.isOpen !== undefined && (
                              <span className="text-xs font-semibold" style={{ color: place.isOpen ? 'var(--color-success)' : 'var(--color-error)' }}>
                                {place.isOpen ? 'Buka' : 'Tutup'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Place Detail */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 rounded-3xl p-6"
            style={{ backgroundColor: 'var(--bg-canvas)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-ink)', letterSpacing: '-0.02em' }}>{selectedPlace.name}</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{selectedPlace.address}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => openDirections(selectedPlace)}
                    className="btn-primary h-10 px-5 gap-2 text-sm"
                  >
                    <Navigation className="w-4 h-4" /> Petunjuk Arah
                  </button>
                  {selectedPlace.rating && (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--text-ink)' }}>
                      <Star className="w-4 h-4 fill-current" style={{ color: 'var(--color-warning)' }} />
                      {selectedPlace.rating} / 5
                      {selectedPlace.totalRatings && ` (${selectedPlace.totalRatings} ulasan)`}
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                    <MapPin className="w-4 h-4" /> {selectedPlace.distance}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedPlace(null)} className="p-1 transition-colors" style={{ color: 'var(--text-muted)' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-ink)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
