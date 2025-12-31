"use client";
export default function Page() {
  return (
    <form onSubmit={() => { alert('funcionou'); }}>
      <button type="submit">Salvar</button>
    </form>
  );
}