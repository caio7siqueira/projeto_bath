import React from 'react';

interface ExportCSVButtonProps {
  data: any[];
  filename: string;
  disabled?: boolean;
}

export function ExportCSVButton({ data, filename, disabled }: ExportCSVButtonProps) {
  const handleExport = () => {
    if (!data?.length || disabled) return;
    const csv = [Object.keys(data[0] || {}).join(',')]
      .concat(data.map((row) => Object.values(row).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      className={`btn btn-outline ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      onClick={handleExport}
      disabled={disabled || !data?.length}
    >
      Exportar CSV
    </button>
  );
}
