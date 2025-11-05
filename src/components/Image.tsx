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

  // <-- 修正: 提供されたCSV(x,y,left_path,right_path)の形式に対応
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const csvData = reader.result as string;

        // (x, y) でグループ化するためのMap
        const groupedData = new Map<string, GridCell>();
        const rows = csvData.split('\n');

        // ヘッダー行をスキップ (i = 1 から開始)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split(',');

          // 4列未満または空行はスキップ
          if (row.length < 4 || row.every((field) => field.trim() === '')) {
            continue;
          }

          // CSVの列を正しくマッピング
          const [xStr, yStr, leftPath, rightPath] = row;

          const x = parseInt(xStr);
          const y = parseInt(yStr);

          if (isNaN(x) || isNaN(y)) {
            continue; // x, y が不正な場合はスキップ
          }

          const key = `${x}-${y}`;

          // (x, y) ごとに1行しかない前提
          if (!groupedData.has(key)) {
            groupedData.set(key, {
              x: x,
              y: y,
              images: [], // 空の配列で初期化
            });
          }

          const cell = groupedData.get(key)!;

          // leftPath が空でない場合のみ追加
          if (leftPath && leftPath.trim() !== '') {
            cell.images.push({
              side: 'left',
              src: `/images/${leftPath.trim()}`,
            });
          }

          // rightPath が空でない場合のみ追加
          if (rightPath && rightPath.trim() !== '') {
            cell.images.push({
              side: 'right',
              src: `/images/${rightPath.trim()}`,
            });
          }
        }

        const parsed: GridCell[] = Array.from(groupedData.values());
        console.log('Parsed Data:', parsed); // デバッグ用
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
    if (!currentPosition) return;

    // data (グリッド全体) を 1次元の配列に平坦化
    const flatGrid = data.flat();

    // 現在のセルのインデックスを flatGrid から探す
    const currentIndex = flatGrid.findIndex(
      (cell) => cell.x === currentPosition.x && cell.y === currentPosition.y
    );

    if (currentIndex === -1) return; // 見つからない場合は何もしない

    // 次または前のセルのインデックスを計算
    const newIndex =
      direction === 'next'
        ? (currentIndex + 1) % flatGrid.length
        : (currentIndex - 1 + flatGrid.length) % flatGrid.length;

    // 次のセル情報を取得
    const nextCell = flatGrid[newIndex];

    // 現在位置を次のセルに更新
    setCurrentPosition({ x: nextCell.x, y: nextCell.y });
    
    // 新しいセルに移動したので、表示する画像インデックスを 0 にリセット
    setCurrentImageIndex(0);
  };
  
  // <-- 追加: 左右切り替え用の関数
  const handleSideChange = () => {
    const images = getCurrentImages();
    const currentImg = getCurrentImage();
    if (!currentImg) return;

    const currentSide = currentImg.side;
    const targetSide = currentSide === 'left' ? 'right' : 'left';

    // ターゲットサイドの最初の画像を探す
    const targetImageIndex = images.findIndex(img => img.side === targetSide);

    if (targetImageIndex !== -1) {
      // ターゲットサイドの画像が見つかったら、そのインデックスに設定
      setCurrentImageIndex(targetImageIndex);
    } else {
      // ターゲットサイドの画像がない場合
      console.warn(`No images found for side: ${targetSide}`);
    }
  };

  // <-- 修正: パースロジック変更に伴い、find を使うように最適化
  const getCurrentImages = (): { side: 'left' | 'right'; src: string }[] => {
    if (currentPosition) {
      const { x, y } = currentPosition;
      // (x, y) に一致するセルを探す
      const sectionCell = parsedData.find((cell) => cell.x === x && cell.y === y);
      
      if (sectionCell) {
        return sectionCell.images; // そのセルの画像配列を返す
      }
    }
    return [];
  };
  

  const getCurrentImage = (): { side: 'left' | 'right'; src: string } | undefined => {
    const images = getCurrentImages();
    // インデックスが範囲外になった場合、0に戻すか、最初の画像を選択する
    let indexToUse = currentImageIndex;
    if (currentImageIndex >= images.length || currentImageIndex < 0) {
      indexToUse = 0; 
    }

    if (images.length > 0) {
      return images[indexToUse];
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
            zIndex: 1000, // zIndexを追加して最前面に
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
              border: 'none', // 枠線を削除
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
      left: '50%',
      transform: 'translateX(-50%)',
    }}
    onClick={handleSideChange}
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
      border: 'none', // 枠線を削除
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
      border: 'none', // 枠線を削除
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
