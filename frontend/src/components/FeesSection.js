import React, { useEffect, useState } from 'react';
import axios from 'axios';

function FeesSection({ tenantId }) {
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`${API_URL}/tenant-config/${tenantId}/fees`);
        setFees(resp.data.fees);
        setError(null);
      } catch (err) {
        console.error('Error cargando aranceles:', err);
        setError('No fue posible cargar los aranceles');
      } finally {
        setLoading(false);
      }
    };
    if (tenantId) load();
  }, [tenantId]);

  if (loading) {
    return (
      <section className="fees-section">
        <h3>Aranceles</h3>
        <p>Cargando aranceles…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="fees-section">
        <h3>Aranceles</h3>
        <p className="fees-error">{error}</p>
      </section>
    );
  }

  if (!fees) return null;

  const money = (n) => (n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: fees.currency || 'ARS' });

  return (
    <section className="fees-section">
      <h3>💳 Aranceles</h3>
      <div className="fees-grid">
        <div className="fee-card">
          <h4>Matrícula</h4>
          <p className="fee-amount">{money(fees.inscription_fee)}</p>
          <p className="fee-note">Pago único de inscripción</p>
        </div>
        <div className="fee-card">
          <h4>Cuota mensual</h4>
          <p className="fee-amount">{money(fees.monthly_fee?.amount)}</p>
          <p className="fee-note">{fees.monthly_fee?.installments} cuotas al año</p>
        </div>
        <div className="fee-card">
          <h4>Vencimientos</h4>
          <p className="fee-note">Días: {fees.due_dates?.join(', ') || '-'}</p>
          <p className="fee-note">Recargo por mora: {fees.late_fee?.percent || 0}%</p>
        </div>
        <div className="fee-card">
          <h4>Métodos de pago</h4>
          <ul className="fee-list">
            {(fees.payment_methods || []).map((m, i) => (<li key={i}>{m}</li>))}
          </ul>
        </div>
      </div>

      {fees.discounts?.length > 0 && (
        <div className="fees-discounts">
          <h4>Descuentos</h4>
          <ul>
            {fees.discounts.map((d, i) => (
              <li key={i}><strong>{d.label || d.type}:</strong> {d.percent}% {d.until_day ? `(hasta día ${d.until_day})` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default FeesSection;
