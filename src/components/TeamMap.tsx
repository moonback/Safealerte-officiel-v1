import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// Helper component to integrate Leaflet‑Draw for admins
function DrawControl({ teamId }: { teamId: string }) {
    const map = useMap();
    const { role } = useAuth();
    useEffect(() => {
        if (role !== 'admin') return; // only admins can edit zones
        const drawControl = new L.Control.Draw({
            position: 'topright',
            draw: {
                polygon: {},
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
            },
            edit: {
                featureGroup: editableLayers,
                remove: true,
            },
        });
        map.addControl(drawControl);
        map.on(L.Draw.Event.CREATED, async (e: any) => {
            const layer = e.layer as L.Polygon;
            const geojson = layer.toGeoJSON();
            // Persist polygon in Supabase – simple table `search_zones`
            const { error } = await supabase.from('search_zones').insert({
                team_id: teamId,
                geometry: geojson.geometry,
            });
            if (error) console.error('Error saving zone', error);
            editableLayers.addLayer(layer);
        });
        map.on(L.Draw.Event.EDITED, async (e: any) => {
            const layers = e.layers;
            const updates: any[] = [];
            layers.eachLayer((layer: any) => {
                const geojson = layer.toGeoJSON();
                updates.push({
                    id: layer.feature?.properties?.id,
                    geometry: geojson.geometry,
                });
            });
            // Bulk update – simplistic approach
            for (const upd of updates) {
                const { error } = await supabase
                    .from('search_zones')
                    .update({ geometry: upd.geometry })
                    .eq('id', upd.id);
                if (error) console.error('Error updating zone', error);
            }
        });
        map.on(L.Draw.Event.DELETED, async (e: any) => {
            const layers = e.layers;
            const ids: string[] = [];
            layers.eachLayer((layer: any) => {
                if (layer.feature?.properties?.id) ids.push(layer.feature.properties.id);
            });
            if (ids.length) {
                const { error } = await supabase.from('search_zones').delete().in('id', ids);
                if (error) console.error('Error deleting zones', error);
            }
        });
        return () => {
            map.removeControl(drawControl);
            map.off(L.Draw.Event.CREATED);
            map.off(L.Draw.Event.EDITED);
            map.off(L.Draw.Event.DELETED);
        };
    }, [map, role, teamId]);
    return null;
}
// Layer group to hold editable polygons (admin only)
const editableLayers = new L.FeatureGroup();
export default function TeamMap({ teamId }: { teamId: string }) {
    const { role } = useAuth();
    const mapRef = useRef<L.Map>(null);
    // Load existing zones from Supabase
    useEffect(() => {
        const fetchZones = async () => {
            const { data, error } = await supabase
                .from('search_zones')
                .select('id, geometry')
                .eq('team_id', teamId);
            if (error) return console.error(error);
            data?.forEach((zone: any) => {
                const layer = L.geoJSON(zone.geometry, {
                    style: { color: '#00ffff', fillOpacity: 0.2 },
                });
                (layer as any).feature = { properties: { id: zone.id } };
                editableLayers.addLayer(layer);
            });
        };
        fetchZones();
    }, [teamId]);
    // Subscribe to real‑time location updates
    useEffect(() => {
        const channel = supabase
            .channel(`public:team_locations:team_${teamId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'team_locations', filter: `team_id=eq.${teamId}` },
                (payload) => {
                    // Force map re‑render by adding/updating a marker
                    const { latitude, longitude, id } = payload.new;
                    const marker = L.marker([latitude, longitude]);
                    (marker as any).id = id;
                    marker.addTo(mapRef.current!);
                }
            )
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [teamId]);
    return (
        <MapContainer
            center={[48.8566, 2.3522]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            whenCreated={(map) => {
                mapRef.current = map;
                // add editable layer group to map
                editableLayers.addTo(map);
            }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            {/* Polygons from DB are added via the effect above */}
            {role === 'admin' && <DrawControl teamId={teamId} />}
        </MapContainer>
    );
}
