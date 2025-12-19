import React from 'react';

export function ExportCSVButton({ data, filename }: { data: any[], filename: string }) {
  const handleExport = () => {
    const csv = [Object.keys(data[0] || {}).join(',')].concat(
      data.map(row => Object.values(row).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return <button className="btn btn-outline" onClick={handleExport}>Exportar CSV</button>;
}
