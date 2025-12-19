import React, { useState } from 'react';

export default function NotificationSettings({ settings, onUpdate }: { settings: any, onUpdate: (data: any) => void }) {
  const [enabled, setEnabled] = useState(settings?.reminderEnabled ?? true);
  const handleToggle = () => {
    setEnabled(!enabled);
    onUpdate({ reminderEnabled: !enabled });
  };
  return (
    <div>
      <h2>Configuração de lembretes</h2>
      <label>
        <input type="checkbox" checked={enabled} onChange={handleToggle} /> Ativar lembretes
      </label>
    </div>
  );
}
