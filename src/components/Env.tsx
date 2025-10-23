import React, { useState } from 'react';
import Papa from 'papaparse';
import { FaFileUpload } from 'react-icons/fa';

interface CellData {
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  x: number;
  y: number;
}

interface Dataset {
  name: string;
  data: CellData[][];
}

interface CsvRow {
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  x: number;
  y: number;
}

const Env: React.FC = () => {
  const generateDefaultGrid = (): CellData[][] => {
    const grid: CellData[][] = [];
    for (let y = 0; y < 13; y++) {
      const row: CellData[] = [];
      for (let x = 0; x < 3; x++) {
        row.push({ temperature: null, humidity: null, co2: null, x, y });
      }
      grid.push(row);
    }
    return grid;
  };

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataType, setSelectedDataType] = useState<'temperature' | 'humidity' | 'co2'>('temperature');
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // ズームレベルを管理する状態

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<CsvRow>(file, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          const updatedGrid = generateDefaultGrid();
          result.data.forEach((row) => {
            const x = row.x;
            const y = row.y;
            if (x >= 0 && x < 3 && y >= 0 && y < 13) {
              updatedGrid[y][x] = {
                temperature: row.temperature,
                humidity: row.humidity,
                co2: row.co2,
                x,
                y,
              };
            }
          });
          setDatasets((prev) => [...prev, { name: file.name, data: updatedGrid }]);
        },
      });
    }
  };

  const handleRemoveDataset = (index: number) => {
    setDatasets((prev) => prev.filter((_, i) => i !== index));
  };

  const getCellValue = (cell: CellData) => {
    return cell[selectedDataType];
  };

  const getCellColor = (value: number | null): string => {
    if (value === null) return '#ccc'; // データがない場合は灰色
  
    const alpha = Math.min(1, Math.abs(value)); // アルファ値は0.0～1.0に制限
  
    switch (selectedDataType) {
      case 'temperature':
        // 温度: 負の値は青、正の値は赤
        return value < 0
          ? `rgba(0, 0, 255, ${alpha})` // 負の値は青系
          : `rgba(255, 0, 0, ${alpha})`; // 正の値は赤系
  
      case 'humidity':
        // 湿度: 負の値も青系、正の値も青系（濃淡で変化）
        return `rgba(0, 0, 255, ${alpha})`; // 常に青の濃淡で表示
  
      default:
        return '#ccc'; // デフォルトは灰色
    }
  };
  

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Environmental Data Heatmaps</h2>

      {/* File Upload Button */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          id="file-upload"
          style={{ display: 'none' }}
        />
        <label
          htmlFor="file-upload"
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <FaFileUpload style={{ marginRight: '8px' }} />
          Upload CSV File
        </label>
      </div>

      {/* Data Type Selection */}
      <div style={{ margin: '20px 0' }}>
        <label style={{ fontSize: '16px', marginRight: '10px' }}>Select Data Type: </label>
        <select
          value={selectedDataType}
          onChange={(e) => setSelectedDataType(e.target.value as 'temperature' | 'humidity' | 'co2')}
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            cursor: 'pointer',
            backgroundColor: '#f9f9f9',
          }}
        >
          <option value="temperature">Temperature</option>
          <option value="humidity">Humidity</option>
          <option value="co2">CO2</option>
        </select>
      </div>

      {/* Zoom Level Control */}
      <div style={{ margin: '20px 0' }}>
        <label style={{ fontSize: '16px', marginRight: '10px' }}>Zoom Level: </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          style={{ width: '200px' }}
        />
        <span style={{ marginLeft: '10px', fontSize: '16px' }}>{zoomLevel.toFixed(1)}x</span>
      </div>

      {/* Heatmaps Container with Horizontal Scroll */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '10px', gap: '20px' }}>
        {datasets.map((dataset, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            {/* Heatmap Name and Delete Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '18px', margin: '0' }}>{dataset.name}</h3>
              <button
                onClick={() => handleRemoveDataset(index)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#f44336',
                  padding: '0 8px',
                }}
              >
                ✖️
              </button>
            </div>

            {/* Heatmap Grid */}
            <div
              style={{
                display: 'inline-grid',
                gridTemplateColumns: 'repeat(3, 60px)',
                gap: '5px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center',
              }}
            >
              {dataset.data.map((row, rowIndex) =>
                row.map((cell, cellIndex) => {
                  const cellValue = getCellValue(cell);
                  return (
                    <div
                      key={`${rowIndex}-${cellIndex}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: getCellColor(cellValue),
                        color: 'white',
                        fontSize: '14px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cellValue !== null ? cellValue.toFixed(1) : ''}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip for hovered cell */}
      {hoveredCell && (
        <div style={{ marginTop: '20px', fontSize: '16px', color: '#555' }}>
          Hovered Cell - X: {hoveredCell.x}, Y: {hoveredCell.y}, Value: {getCellValue(hoveredCell)}
        </div>
      )}
    </div>
  );
};

export default Env;
