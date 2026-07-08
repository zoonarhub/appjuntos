import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Map, Users, Building2, Vote, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createColorIcon = (color: string) => new L.DivIcon({
  html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const MapaEleitoral: React.FC = () => {
  const [eleitores, setEleitores] = useState<any[]>([]);
  const [coordenadores, setCoordenadores] = useState<any[]>([]);
  const [liderancas, setLiderancas] = useState<any[]>([]);
  const [nucleos, setNucleos] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showEleitores, setShowEleitores] = useState(true);
  const [showCoordenadores, setShowCoordenadores] = useState(true);
  const [showLiderancas, setShowLiderancas] = useState(true);
  const [showNucleos, setShowNucleos] = useState(true);
  const [votoFilter, setVotoFilter] = useState('todos');

  useEffect(() => {
    fetchMapData();
    fetchGeoJson();
  }, []);

  const fetchGeoJson = async () => {
    try {
      // IBGE API for Rio de Janeiro state (municipios)
      const res = await fetch('https://servicodados.ibge.gov.br/api/v3/malhas/estados/33?formato=application/vnd.geo+json&resolucao=5');
      const data = await res.json();
      setGeoData(data);
    } catch (e) {
      console.error('Error fetching GeoJSON', e);
    }
  }

  const fetchMapData = async () => {
    setLoading(true);
    const [resEleitores, resCoord, resLideranca, resNucleos] = await Promise.all([
      supabase.from('eleitores').select('*').not('lat', 'is', null),
      supabase.from('coordenadores').select('*').not('lat', 'is', null),
      supabase.from('liderancas').select('*').not('lat', 'is', null),
      supabase.from('nucleos').select('*').not('lat', 'is', null)
    ]);
    
    if (resEleitores.data) setEleitores(resEleitores.data);
    if (resCoord.data) setCoordenadores(resCoord.data);
    if (resLideranca.data) setLiderancas(resLideranca.data);
    if (resNucleos.data) setNucleos(resNucleos.data);
    
    setLoading(false);
  };

  const filteredEleitores = eleitores.filter(e =>
    votoFilter === 'todos' || e.confirmou_voto === votoFilter
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mapa Eleitoral</h1>
          <p className="page-subtitle">Inteligência territorial – Divisão por Zonas e Municípios</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={fetchMapData}>
            Atualizar Dados
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card mb-lg" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Camadas:</span>
          {[
            { label: 'Eleitores', active: showEleitores, toggle: () => setShowEleitores(v => !v), color: '#6366F1', count: filteredEleitores.length },
            { label: 'Coordenadores', active: showCoordenadores, toggle: () => setShowCoordenadores(v => !v), color: '#10B981', count: coordenadores.length },
            { label: 'Lideranças', active: showLiderancas, toggle: () => setShowLiderancas(v => !v), color: '#8B5CF6', count: liderancas.length },
            { label: 'Núcleos', active: showNucleos, toggle: () => setShowNucleos(v => !v), color: '#F59E0B', count: nucleos.length },
          ].map(layer => (
            <button key={layer.label} onClick={layer.toggle} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: `2px solid ${layer.active ? layer.color : 'var(--border-default)'}`,
              background: layer.active ? layer.color + '15' : 'transparent',
              color: layer.active ? layer.color : 'var(--text-tertiary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: layer.active ? layer.color : 'var(--text-disabled)' }} />
              {layer.label} <span style={{ opacity: 0.7 }}>({layer.count})</span>
            </button>
          ))}

          <div style={{ marginLeft: 'auto' }}>
            <select className="form-select" style={{ width: 180 }} value={votoFilter} onChange={e => setVotoFilter(e.target.value)}>
              <option value="todos">Todos os Eleitores</option>
              <option value="sim">Confirmaram Voto</option>
              <option value="indeciso">Indecisos</option>
              <option value="nao">Não Confirmaram</option>
              <option value="outro_candidato">Outro Candidato</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', height: 600, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        )}
        <MapContainer
          center={[-22.9068, -43.1729] as any}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />

          {geoData && (
            <GeoJSON 
              data={geoData} 
              style={{
                color: '#4f46e5',
                weight: 1,
                opacity: 0.4,
                fillColor: '#6366f1',
                fillOpacity: 0.05
              }}
            />
          )}

          {/* Eleitores */}
          {showEleitores && filteredEleitores.map(e => (
            <Marker key={e.id} position={[e.lat, e.lng]} icon={createColorIcon(
              e.confirmou_voto === 'sim' ? '#10B981' :
              e.confirmou_voto === 'indeciso' ? '#F59E0B' :
              e.confirmou_voto === 'nao' ? '#EF4444' : '#6B7280'
            ) as any}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, color: '#111' }}>{e.nome}</div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>{e.bairro} • Zona {e.zona}</div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: e.confirmou_voto === 'sim' ? '#10B981' : '#F59E0B' }}>
                      {e.confirmou_voto === 'sim' ? '✓ Confirmou voto' :
                       e.confirmou_voto === 'indeciso' ? '? Indeciso' :
                       e.confirmou_voto === 'nao' ? '✗ Não confirmou' : '⚠ Outro candidato'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>Influência: {e.influencia}/10 • +{e.votos_familia} família</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Coordenadores */}
          {showCoordenadores && coordenadores.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={createColorIcon('#10B981') as any}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: '#111' }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>Coordenador {c.tipo}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{c.bairro} • {c.regiao}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                    Meta: {c.meta} votos • Atual: {c.votos}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Lideranças */}
          {showLiderancas && liderancas.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={createColorIcon('#8B5CF6') as any}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, color: '#111' }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600 }}>Liderança</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{c.bairro} • {c.regiao}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                    Meta: {c.meta} votos • Atual: {c.votos}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Núcleos */}
          {showNucleos && nucleos.map(n => (
            <React.Fragment key={n.id}>
              <Marker position={[n.lat, n.lng]} icon={createColorIcon('#F59E0B') as any}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, color: '#111' }}>{n.nome}</div>
                    <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>{n.regiao}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                      {n.participantes} participantes • {n.projetos_count} projetos
                    </div>
                  </div>
                </Popup>
              </Marker>
              <Circle center={[n.lat, n.lng]} radius={1200} {...{pathOptions: { color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.05, weight: 1 }} as any} />
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="card mt-md" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)' }}>LEGENDA:</span>
          {[
            { color: '#10B981', label: 'Confirmou Voto' },
            { color: '#F59E0B', label: 'Indeciso' },
            { color: '#EF4444', label: 'Não Confirmou' },
            { color: '#6B7280', label: 'Outro Candidato' },
            { color: '#10B981', label: '● Coordenador', border: true },
            { color: '#F59E0B', label: '● Núcleo', border: true },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, border: l.border ? '2px solid white' : 'none' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapaEleitoral;
