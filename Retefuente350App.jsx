
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

const Retefuente350App = () => {
  const [datosIniciales, setDatosIniciales] = useState({ nit: '', nombre: '', periodo: '' });
  const [balanceData, setBalanceData] = useState([]);
  const [auxiliarData, setAuxiliarData] = useState([]);
  const [errores, setErrores] = useState([]);
  const [resumen, setResumen] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDatosIniciales((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e, setData) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setData(data.slice(5)); // skip headers
    };
    reader.readAsBinaryString(file);
  };

  const procesarResumen = () => {
    const resumenGenerado = balanceData.map((row) => {
      const cuenta = row[0];
      const nombre = row[1];
      const debito = row[3] || 0;
      const credito = row[4] || 0;
      return {
        cuenta,
        nombre,
        base: debito - credito,
        retencion: (debito - credito) * 0.025, // ejemplo
      };
    });
    setResumen(resumenGenerado);
  };

  const validarErrores = () => {
    const erroresDetectados = auxiliarData
      .filter((row) => row[5] > 1000000 && row[6] < 0.02)
      .map((row) => ({
        cuenta: row[1],
        base: row[5],
        porcentaje: row[6],
        mensaje: 'Porcentaje de retención inusualmente bajo para esta base',
      }));
    setErrores(erroresDetectados);
  };

  const exportToPDF = (data, title) => {
    const doc = new jsPDF();
    doc.text(title, 10, 10);
    data.forEach((row, i) => {
      doc.text(JSON.stringify(row), 10, 20 + i * 10);
    });
    doc.save(`${title}.pdf`);
  };

  const exportToExcel = (data, title) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Aplicativo Web Retefuente-350</h1>

      <div className="grid grid-cols-3 gap-4">
        <input name="nit" value={datosIniciales.nit} onChange={handleInputChange} placeholder="NIT" className="p-2 border rounded" />
        <input name="nombre" value={datosIniciales.nombre} onChange={handleInputChange} placeholder="Nombre" className="p-2 border rounded" />
        <input name="periodo" value={datosIniciales.periodo} onChange={handleInputChange} placeholder="Periodo" className="p-2 border rounded" />
      </div>

      <div className="space-y-2">
        <label>Subir hoja Balance</label>
        <input type="file" accept=".xlsx" onChange={(e) => handleFileUpload(e, setBalanceData)} />
        <label>Subir hoja Auxiliar</label>
        <input type="file" accept=".xlsx" onChange={(e) => handleFileUpload(e, setAuxiliarData)} />
      </div>

      <div className="flex gap-4">
        <button onClick={procesarResumen} className="bg-blue-500 text-white px-4 py-2 rounded">Generar Resumen</button>
        <button onClick={validarErrores} className="bg-red-500 text-white px-4 py-2 rounded">Validar Errores</button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Resumen</h2>
        <button onClick={() => exportToPDF(resumen, 'Resumen')} className="bg-green-500 text-white px-2 py-1 rounded">Exportar a PDF</button>
        <button onClick={() => exportToExcel(resumen, 'Resumen')} className="bg-yellow-500 text-white px-2 py-1 rounded">Exportar a Excel</button>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(resumen, null, 2)}</pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Errores</h2>
        <button onClick={() => exportToPDF(errores, 'Errores')} className="bg-green-500 text-white px-2 py-1 rounded">Exportar a PDF</button>
        <button onClick={() => exportToExcel(errores, 'Errores')} className="bg-yellow-500 text-white px-2 py-1 rounded">Exportar a Excel</button>
        <pre className="bg-red-100 p-2 rounded text-sm">{JSON.stringify(errores, null, 2)}</pre>
      </div>
    </div>
  );
};

export default Retefuente350App;
