import { useState } from 'react';
import { api } from '../../api/client.js';

export function DeviceDetails({ device, onClose, onUpdated }) {
  const [label, setLabel] = useState(device?.customLabel ?? '');
  const [type, setType] = useState(device?.deviceType ?? 'unknown');
  const [saving, setSaving] = useState(false);

  if (!device) return null;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateDevice(device.id, { customLabel: label, deviceType: type });
      onUpdated?.(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="ns-details">
      <button className="ns-details__close" onClick={onClose} aria-label="Close">×</button>
      <h2>{device.customLabel || device.hostname || device.ip}</h2>
      <dl>
        <dt>IP</dt>
        <dd>{device.ip ?? '—'}</dd>
        <dt>MAC</dt>
        <dd>{device.mac ?? '—'}</dd>
        <dt>Hostname</dt>
        <dd>{device.hostname ?? '—'}</dd>
        <dt>Vendor</dt>
        <dd>{device.vendor ?? '—'}</dd>
        <dt>Status</dt>
        <dd className={`ns-status ns-status--${device.status}`}>{device.status}</dd>
        <dt>Last seen</dt>
        <dd>{new Date(device.lastSeen).toLocaleString()}</dd>
        <dt>First seen</dt>
        <dd>{new Date(device.firstSeen).toLocaleString()}</dd>
      </dl>

      <label>
        Custom label
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={device.hostname ?? device.ip} />
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="unknown">Unknown</option>
          <option value="router">Router</option>
          <option value="computer">Computer</option>
          <option value="phone">Phone</option>
          <option value="tv">TV</option>
          <option value="iot">IoT</option>
        </select>
      </label>
      <button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </aside>
  );
}
