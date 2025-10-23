import React, { useState } from 'react';
import { FaFileUpload, FaImage, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface GridCell {
  x: number;
  y: number;
  images: { side: 'left' | 'right'; src: string }[];
}

const Image: React.FC = () => {
  const generateDefaultGrid = (): { x: number; y: number }[][] => {
    const grid = [];
    for (let y = 0; y < 13; y++) {
      const row = [];
      for (let x = 0; x < 3; x++) {
        row.push({ x, y });
      }
      grid.push(row);
    }
    return grid;
  };

  const [data] = useState(generateDefaultGrid);
  const [parsedData, setParsedData] = useState<GridCell[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const csvData = reader.result as string;
        const parsed = csvData
          .split('\n')
          .map((row) => row.split(','))
          .filter((row) => row.length >= 4) // 無効な行を除外
          .map(([x, y, sideValue, srcValue]) => ({
            x: parseInt(x),
            y: parseInt(y),
            images: [
              { side: sideValue.trim() as 'left' | 'right', src: `/images/${srcValue.trim()}` },
            ],
          }));
        setParsedData(parsed);
      };
      reader.readAsText(file);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    setCurrentPosition({ x, y });
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  const handleImageChange = (direction: 'next' | 'prev') => {
    if (currentPosition) {
      const images = getCurrentImages(); // 現在のセクション内の全画像を取得
      const currentSide = getCurrentImage()?.side; // 現在の画像の種類 ('left' または 'right')
      console.log('Current Side:', currentSide); // デバッグ用
  
      if (currentSide) {
        // 現在の種類で画像をフィルタリング
        const filteredImages = images.filter((img) => img.side === currentSide);
        console.log('Filtered Images:', filteredImages); // デバッグ用
  
        // 現在表示中の画像のインデックスを取得
        const currentIndex = filteredImages.findIndex(
          (img) => img.src === getCurrentImage()?.src
        );
        console.log('Current Index:', currentIndex); // デバッグ用
  
        if (currentIndex !== -1) {
          // 新しいインデックスを計算
          const newIndex =
            direction === 'next'
              ? (currentIndex + 1) % filteredImages.length
              : (currentIndex - 1 + filteredImages.length) % filteredImages.length;
  
          // 新しい画像を取得
          const newImage = filteredImages[newIndex];
          console.log('New Image:', newImage); // デバッグ用
  
          // 全体のインデックスではなく、セクション内の画像リストに基づいて切り替え
          const newGlobalIndex = images.findIndex(
            (img) => img.src === newImage.src
          );
  
          // インデックスを更新
          setCurrentImageIndex(newGlobalIndex);
          console.log('New Global Index:', newGlobalIndex); // デバッグ用
        }
      }
    }
  };
  
  

  const getCurrentImages = (): { side: 'left' | 'right'; src: string }[] => {
    if (currentPosition) {
      const { x, y } = currentPosition;
      // 現在のセクションに属するすべてのセルの画像を取得
      const sectionCells = parsedData.filter((cell) => cell.x === x && cell.y === y);
      return sectionCells.flatMap((cell) => cell.images); // すべての画像を平坦化してリスト化
    }
    return [];
  };
  
  

  const getCurrentImage = (): { side: 'left' | 'right'; src: string } | undefined => {
    const images = getCurrentImages();
    if (images.length > 0 && currentImageIndex < images.length) {
      return images[currentImageIndex];
    }
    return undefined;
  };
  

  return (
    <div style={{ display: 'flex', flexDirection: 'row', padding: '20px', height: '100vh' }}>
      {/* グリッド表示 */}
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(3, 50px)',
          gap: '10px',
          height: '70%',
          flex: '1',
        }}
      >
        {data.map((row) =>
          row.map((cell) => (
            <div
              key={`${cell.x}-${cell.y}`}
              onClick={() => handleCellClick(cell.x, cell.y)}
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: '#ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: '1px solid #ddd',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {currentPosition && cell.x === currentPosition.x && cell.y === currentPosition.y && (
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    backgroundColor: 'green',
                    borderRadius: '50%',
                    position: 'absolute',
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* ファイルアップロード */}
      <div style={{ marginLeft: '20px', flex: '1', justifyContent: 'flex-start' }}>
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
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <FaFileUpload style={{ marginRight: '8px' }} />
          Upload CSV
        </label>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            color: 'white',
          }}
        >
          {/* 閉じるボタン */}
          <button
            onClick={() => setIsModalOpen(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'red',
              color: 'white',
              padding: '10px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Close
          </button>

          {/* 区画情報 */}
          {currentPosition && (
            <div style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 'bold' }}>
              Section: ({currentPosition.x}, {currentPosition.y})
            </div>
          )}

{/* 画像表示 */}
<div
  style={{
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor:
      getCurrentImage()?.side === 'left' ? '#f0f8ff' : '#ffe4e1',
    width: '100%',
    height: '80%',
    position: 'relative',
  }}
>
  {/* 現在の画像パスを表示 */}
  <div
    style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
      fontSize: '14px',
    }}
  >
    Current Image: {getCurrentImage()?.src || 'No Image'}
  </div>

  {/* 左右画像の切り替えボタン */}
  <div
    style={{
      position: 'absolute',
      top: '10px',
      fontSize: '20px',
      fontWeight: 'bold',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer',
    }}
    onClick={() => {
      if (getCurrentImage()?.side === 'left') {
        setCurrentImageIndex(1); // Right Image
      } else {
        setCurrentImageIndex(0); // Left Image
      }
    }}
  >
    {getCurrentImage()?.side === 'left' ? 'Left Image' : 'Right Image'}
  </div>

  {getCurrentImage()?.src ? (
    <img
      src={getCurrentImage()?.src}
      alt={getCurrentImage()?.side}
      style={{ maxWidth: '80%', maxHeight: '80%' }}
    />
  ) : (
    <FaImage size={100} color="#777" />
  )}
</div>


{/* 前後画像切り替えボタン */}
<div
  style={{
    display: 'flex',
    justifyContent: 'space-between', // 左右端に配置
    alignItems: 'center',
    position: 'absolute', // モーダル内の固定位置に配置
    bottom: '70px', // モーダルの下部に余白を持たせて配置
    width: '80%', // ボタンが横幅内に収まるように調整
  }}
>
  <button
    onClick={() => handleImageChange('prev')}
    style={{
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // ボタンの視認性を向上
    }}
  >
    <FaArrowLeft />
  </button>

  <button
    onClick={() => handleImageChange('next')}
    style={{
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '16px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // ボタンの視認性を向上
    }}
  >
    <FaArrowRight />
  </button>
</div>
        </div>
      )}
    </div>
  );
};

export default Image;
