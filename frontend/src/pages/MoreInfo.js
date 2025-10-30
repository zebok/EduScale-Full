import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MoreInfo.css';
import categoriesData from '../data/categories.json';

function CareersModal({ visible, onClose, careers, institutionName, institucionId }) {
  if (!visible) return null;
  return (
    <div className="mi-modal-backdrop">
      <div className="mi-modal">
        <div className="mi-modal-header">
          <h3>Carreras - {institutionName}</h3>
          <button onClick={onClose}>Cerrar</button>
        </div>
        <div className="mi-modal-body">
          {careers.length === 0 ? (
            <p>No hay carreras disponibles.</p>
          ) : (
            <table className="mi-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Facultad</th>
                  <th>Duración (años)</th>
                  <th>Modalidad</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {careers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.facultad}</td>
                    <td>{c.duracion_años ?? '-'}</td>
                    <td>{c.modalidad ?? '-'}</td>
                    <td>
                      <a className="mi-apply-button" href={`/application-form?institucionId=${institucionId}&carreraId=${c.id}`}>
                        Inscribirme
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MoreInfo() {
  const [instituciones, setInstituciones] = useState([]);
  const [careersMap, setCareersMap] = useState({}); // id -> careers array
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({ province: '', degreeType: '', duration: '', category: '' });
  const [search, setSearch] = useState('');
  // Category select is always visible now

  const [modalState, setModalState] = useState({ visible: false, careers: [], name: '' });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/prospection/instituciones');
        const json = await res.json();
        if (!mounted) return;
        setInstituciones(json.instituciones || []);

        // Fetch careers for each institution in background
        const map = {};
        await Promise.all((json.instituciones || []).map(async (inst) => {
          try {
            const r = await fetch(`/api/prospection/instituciones/${inst.id}/carreras`);
            if (!r.ok) return;
            const j = await r.json();
            map[inst.id] = j.carreras || [];
          } catch (e) {
            map[inst.id] = [];
          }
        }));
        setCareersMap(map);
      } catch (err) {
        console.error('Error cargando instituciones', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const provinces = Array.from(new Set(instituciones.map(i => i.province).filter(Boolean)));

  const degreeTypes = Array.from(new Set(Object.values(careersMap).flat().map(c => c.modalidad || c.degree_type).filter(Boolean)));

  // Categories derived from careers.category (use the 'category' field from tenant careers)
  // Fallback to static list extracted from init-tenants.js if backend does not expose category
  // Prefer explicit career category fields; do NOT use faculty as a category.
  const derivedCategories = Array.from(new Set(Object.values(careersMap).flat().map(c => (c.category || c.categoria)).filter(Boolean))).sort((a,b)=>a.localeCompare(b, 'es'));
  const fallbackCategories = Array.from(new Set(categoriesData)).sort((a,b)=>a.localeCompare(b, 'es'));
  const categories = derivedCategories.length > 0 ? derivedCategories : fallbackCategories;

  const durations = Array.from(new Set(Object.values(careersMap).flat().map(c => c.duracion_años).filter(v => v != null))).sort((a,b)=>a-b);

  function matchesFilters(inst) {
    const careers = careersMap[inst.id] || [];
    if (filters.province && inst.province !== filters.province) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!inst.nombre.toLowerCase().includes(s) && !inst.nombre_corto?.toLowerCase().includes(s)) return false;
    }
    if (filters.degreeType) {
      const any = careers.some(c => (c.modalidad || c.degree_type || '').toLowerCase() === filters.degreeType.toLowerCase());
      if (!any) return false;
    }
    if (filters.category) {
      // Match against the career's `category` property (fallback to empty string)
      const anyCat = careers.some(c => (c.category || '').toLowerCase() === filters.category.toLowerCase());
      if (!anyCat) return false;
    }
    if (filters.duration) {
      const any = careers.some(c => String(c.duracion_años) === String(filters.duration));
      if (!any) return false;
    }
    return true;
  }

  const filtered = instituciones.filter(matchesFilters);

  const navigate = useNavigate();

  return (
    <div className="mi-page">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => navigate('/')} className="mi-back-button">← Volver al inicio</button>
        <button onClick={() => { setFilters({ province: '', degreeType: '', duration: '' }); setSearch(''); }} className="mi-reset-button">Reset filtros</button>
      </div>
      <header className="mi-header">
        <h1>Más Información</h1>
        <p>Explorá universidades y filtrá por carreras, ubicación y duración.</p>
      </header>

      <section className="mi-filters">
        <input placeholder="Buscar universidad" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={filters.province} onChange={e=>setFilters({...filters, province: e.target.value})}>
          <option value="">Todas las provincias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.duration} onChange={e=>setFilters({...filters, duration: e.target.value})}>
          <option value="">Cualquier duración</option>
          {durations.map(d => <option key={d} value={d}>{d} años</option>)}
        </select>
        <select value={filters.degreeType} onChange={e=>setFilters({...filters, degreeType: e.target.value})}>
          <option value="">Todas las modalidades</option>
          {degreeTypes.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.category} onChange={e=>setFilters({...filters, category: e.target.value})}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>

      <section className="mi-list">
        {loading ? <p>Cargando instituciones...</p> : (
          filtered.length === 0 ? <p>No se encontraron universidades con los filtros seleccionados.</p> : (
            filtered.map(inst => (
              <div className="mi-card" key={inst.id}>
                <div className="mi-card-left">
                  {inst.logo_url ? <img src={inst.logo_url} alt="logo" /> : <div className="mi-logo-placeholder" />}
                </div>
                <div className="mi-card-body">
                  <h3>{inst.nombre}</h3>
                  <div className="mi-meta">{inst.city || '-'} · {inst.province || '-'}</div>
                  <div className="mi-meta">{inst.tipo} · {inst.total_carreras} carreras</div>
                </div>
                <div className="mi-card-actions">
                  <button onClick={() => setModalState({ visible: true, careers: careersMap[inst.id] || [], name: inst.nombre, institucionId: inst.id })}>Ver carreras</button>
                </div>
              </div>
            ))
          )
        )}
      </section>

      <CareersModal visible={modalState.visible} onClose={() => setModalState({ visible: false, careers: [], name: '', institucionId: '' })} careers={modalState.careers} institutionName={modalState.name} institucionId={modalState.institucionId} />
    </div>
  );
}
