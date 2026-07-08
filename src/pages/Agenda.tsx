import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, Loader2, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';

const localizer = momentLocalizer(moment);

const Agenda: React.FC = () => {
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: '', tipo: 'Reunião', data: '', hora: '12:00', local: '',
    responsavel: '', status: 'agendado'
  });

  // Filter State
  const [filterType, setFilterType] = useState('todos');

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    setLoading(true);
    const resEventos = await supabase.from('eventos').select('*');
    const resVisitas = await supabase.from('visitas').select('*');

    const mappedEvents: any[] = [];

    if (resEventos.data) {
      resEventos.data.forEach(e => {
        if (!e.data) return;
        try {
          let year, month, day;
          if (e.data.includes('/')) {
            const parts = e.data.split('/');
            year = parseInt(parts[2]); month = parseInt(parts[1]) - 1; day = parseInt(parts[0]);
          } else {
            const parts = e.data.split('-');
            year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]);
          }
          const hour = parseInt(e.hora?.split(':')[0] || '12');
          mappedEvents.push({
            title: `Evento: ${e.nome}`,
            start: new Date(year, month, day, hour, 0),
            end: new Date(year, month, day, hour + 2, 0),
            allDay: false,
            type: 'evento'
          });
        } catch(err) {}
      });
    }

    if (resVisitas.data) {
      resVisitas.data.forEach(v => {
        if (!v.data) return;
        try {
          let year, month, day;
          if (v.data.includes('/')) {
            const parts = v.data.split('/');
            year = parseInt(parts[2]); month = parseInt(parts[1]) - 1; day = parseInt(parts[0]);
          } else {
            const parts = v.data.split('-');
            year = parseInt(parts[0]); month = parseInt(parts[1]) - 1; day = parseInt(parts[2]);
          }
          const hour = parseInt(v.hora?.split(':')[0] || '12');
          mappedEvents.push({
            title: `Visita: ${v.endereco}`,
            start: new Date(year, month, day, hour, 0),
            end: new Date(year, month, day, hour + 1, 0),
            allDay: false,
            type: 'visita'
          });
        } catch(err) {}
      });
    }

    setEventsData(mappedEvents);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('eventos').insert([{
      ...formData,
      municipio: 'Rio de Janeiro',
      participantes: 0,
      custo: 0,
      bairro: 'Não informado',
      descricao: 'Compromisso criado pela Agenda'
    }]);
    
    if (!error) {
      addNotification('Compromisso criado com sucesso!', 'success');
      setShowModal(false);
      fetchAgenda();
    } else {
      addNotification('Erro ao criar compromisso.', 'error');
    }
  };

  const filteredEvents = eventsData.filter(e => 
    filterType === 'todos' ? true : e.type === filterType
  );

  return (
    <div>
      <style>{`
        .rbc-calendar { font-family: 'Inter', sans-serif; color: var(--text-primary); }
        .rbc-header { padding: 10px; font-weight: 600; font-size: 13px; text-transform: uppercase; color: var(--text-secondary); border-bottom: 1px solid var(--border-subtle) !important; }
        .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid var(--border-subtle); border-radius: 8px; overflow: hidden; background: var(--bg-elevated); }
        .rbc-off-range-bg { background: rgba(0,0,0,0.03); }
        .rbc-today { background: var(--brand-primary-alpha) !important; }
        .rbc-event { background: var(--brand-primary); border: none; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 500; }
        .rbc-event.visita { background: var(--success); }
        .rbc-toolbar button { color: var(--text-secondary); border-color: var(--border-subtle); border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .rbc-toolbar button:active, .rbc-toolbar button.rbc-active { background: var(--brand-primary); color: white; border-color: var(--brand-primary); box-shadow: none; }
        .rbc-toolbar button:hover:not(.rbc-active) { background: var(--bg-hover); }
        .dark .rbc-off-range-bg { background: rgba(255,255,255,0.02); }
        .dark .rbc-day-bg + .rbc-day-bg, .dark .rbc-month-row + .rbc-month-row, .dark .rbc-header + .rbc-header { border-color: var(--border-subtle); }
      `}</style>
      
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda</h1>
          <p className="page-subtitle">Compromissos, eventos e reuniões integradas</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={() => {
            setFormData({nome: '', tipo: 'Reunião', data: '', hora: '12:00', local: '', responsavel: '', status: 'agendado'});
            setShowModal(true);
          }}>
            <Plus size={14} /> Novo Compromisso
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}>
          <Filter size={16} /> Filtro de Exibição
        </div>
        <select className="form-select" style={{ width: 220 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="todos">Todos os Compromissos</option>
          <option value="evento">Apenas Eventos</option>
          <option value="visita">Apenas Visitas</option>
        </select>
      </div>

      <div className="card animate-fade-in" style={{ height: 700, padding: 0, overflow: 'hidden' }}>
        {loading ? (
           <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
             <Loader2 className="animate-spin" style={{ marginRight: 8 }} /> Carregando agenda...
           </div>
        ) : (
          <div style={{ padding: 'var(--space-md)', height: '100%' }}>
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              defaultView={Views.MONTH}
              style={{ height: '100%' }}
              eventPropGetter={(event: any) => ({
                className: event.type
              })}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Novo Compromisso</h2>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>Agende um novo evento na agenda</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              <div className="form-group">
                <label className="form-label">Título</label>
                <input required className="form-input" placeholder="Ex: Reunião com Lideranças" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input required type="date" className="form-input" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input required type="time" className="form-input" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Local / Endereço</label>
                <input className="form-input" placeholder="Onde acontecerá?" value={formData.local} onChange={e => setFormData({...formData, local: e.target.value})} />
              </div>
              <div className="modal-footer" style={{ marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary"><CalendarIcon size={14} /> Adicionar na Agenda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
