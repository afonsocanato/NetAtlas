import { forwardRef, useState } from 'react';
import { api } from '../../api/client.js';
import { TYPE_COLOR_VAR } from '../../constants/deviceTypes.js';
import { formatDeviceName } from '../../utils/formatName.js';

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5V5a1 1 0 0 1 1-1h6.5a1 1 0 0 1 .7.3l9 9a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-9-9a1 1 0 0 1-.3-.7z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9l3 3-3 3M13 15h4" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export const DeviceDetails = forwardRef(function DeviceDetails({ device, onClose, onUpdated }, ref) {
  const [label, setLabel] = useState(device.customLabel ?? '');
  const [type, setType] = useState(device.deviceType ?? 'unknown');
  const [saving, setSaving] = useState(false);

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
    <aside ref={ref} className="ns-details">
      <button className="ns-details__close" onClick={onClose} aria-label="Close">
        <CloseIcon />
      </button>

      <div className="ns-details__header">
        <span className="ns-details__type-dot" style={{ background: TYPE_COLOR_VAR[device.deviceType] }} />
        <h2>{formatDeviceName(device.customLabel || device.hostname) || device.ip}</h2>
      </div>

      <span className={`ns-badge ns-badge--${device.status}`}>{device.status}</span>

      <div className="ns-field-list">
        <div className="ns-field">
          <GlobeIcon />
          <span className="ns-field__label">IP</span>
          <span className="ns-field__value">{device.ip ?? '—'}</span>
        </div>
        <div className="ns-field">
          <TagIcon />
          <span className="ns-field__label">MAC</span>
          <span className="ns-field__value">{device.mac ?? '—'}</span>
        </div>
        <div className="ns-field">
          <TerminalIcon />
          <span className="ns-field__label">Hostname</span>
          <span className="ns-field__value">{device.hostname ?? '—'}</span>
        </div>
        <div className="ns-field">
          <BuildingIcon />
          <span className="ns-field__label">Vendor</span>
          <span className="ns-field__value">{device.vendor ?? '—'}</span>
        </div>
        <div className="ns-field">
          <ClockIcon />
          <span className="ns-field__label">Last seen</span>
          <span className="ns-field__value">{new Date(device.lastSeen).toLocaleString()}</span>
        </div>
        <div className="ns-field">
          <ClockIcon />
          <span className="ns-field__label">First seen</span>
          <span className="ns-field__value">{new Date(device.firstSeen).toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save(); }}>
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
        <button type="submit" className="ns-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </aside>
  );
});
