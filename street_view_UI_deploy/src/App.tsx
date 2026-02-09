import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Image as DreiImage, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- 1. 設定 ---
const IMAGE_WIDTH = 320; 
const IMAGE_HEIGHT = 240;
// カメラの視野角(FOV)
const CAMERA_FOV = 50;

//カメラ距離の計算
const CAMERA_Z = (IMAGE_HEIGHT / 2) / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
// 少し余裕を持たせるために微調整
const ADJUSTED_CAMERA_Z = CAMERA_Z * 1.1;

// カメラに「映っている」とみなす範囲
const VISIBLE_THRESHOLD = IMAGE_WIDTH * 1.2; 

// 透明度設定
const OPACITY_VISIBLE = 1.0;
const OPACITY_INVISIBLE = 0.0;

// AKAZEログデータ
const RAW_LOGS = [
  { filename: 'left_20241219_114330.jpg', dx: 0, dy: 0 },
  { filename: 'left_20241219_114331.jpg', dx: -93.43, dy: -13.05 },
  { filename: 'left_20241219_114332.jpg', dx: 28.67, dy: -34.71 },
  { filename: 'left_20241219_114333.jpg', dx: -32.99, dy: -39.81 },
  { filename: 'left_20241219_114335.jpg', dx: -72.88, dy: -23.30 },
  { filename: 'left_20241219_114336.jpg', dx: 16.47, dy: 14.57 },
  { filename: 'left_20241219_114337.jpg', dx: -66.36, dy: -22.38 },
  { filename: 'left_20241219_114338.jpg', dx: -12.62, dy: 15.27 },
  { filename: 'left_20241219_114340.jpg', dx: -68.39, dy: -17.63 },
  { filename: 'left_20241219_114341.jpg', dx: -64.25, dy: -13.84 },
  { filename: 'left_20241219_114342.jpg', dx: 0, dy: 0 },
  { filename: 'left_20241219_114343.jpg', dx: -68.14, dy: -23.11 },
  { filename: 'left_20241219_114345.jpg', dx: -83.02, dy: -22.41 },
  { filename: 'left_20241219_114346.jpg', dx: -16.69, dy: -3.11 },
  { filename: 'left_20241219_114347.jpg', dx: -88.54, dy: -6.09 },
  { filename: 'left_20241219_114348.jpg', dx: -110.16, dy: -23.39 },
  { filename: 'left_20241219_114349.jpg', dx: 12.11, dy: 38.70 },
  { filename: 'left_20241219_114351.jpg', dx: -62.50, dy: -2.81 },
  { filename: 'left_20241219_114352.jpg', dx: -110.61, dy: -13.17 },
  { filename: 'left_20241219_114353.jpg', dx: -30.15, dy: 0.62 },
  { filename: 'left_20241219_114354.jpg', dx: -45.59, dy: -28.42 },
  { filename: 'left_20241219_114356.jpg', dx: -127.01, dy: -4.18 },
  { filename: 'left_20241219_114357.jpg', dx: -0.12, dy: -29.26 },
  { filename: 'left_20241219_114358.jpg', dx: -76.21, dy: -9.96 },
  { filename: 'left_20241219_114359.jpg', dx: -153.54, dy: -26.94 },
  { filename: 'left_20241219_114401.jpg', dx: -63.78, dy: -16.74 },
  { filename: 'left_20241219_114402.jpg', dx: 79.41, dy: 21.44 },
  { filename: 'left_20241219_114403.jpg', dx: -66.49, dy: -12.54 },
  { filename: 'left_20241219_114404.jpg', dx: -22.49, dy: -6.05 },
  { filename: 'left_20241219_114406.jpg', dx: -41.09, dy: -23.54 },
  { filename: 'left_20241219_114407.jpg', dx: -69.53, dy: -18.17 },
  { filename: 'left_20241219_114408.jpg', dx: -63.83, dy: -14.66 },
  { filename: 'left_20241219_114409.jpg', dx: -71.35, dy: -8.76 },
  { filename: 'left_20241219_114411.jpg', dx: -93.96, dy: -23.74 },
  { filename: 'left_20241219_114412.jpg', dx: -51.44, dy: -7.57 },
  { filename: 'left_20241219_114413.jpg', dx: -122.79, dy: -17.78 },
  { filename: 'left_20241219_114414.jpg', dx: 1.95, dy: -0.95 },
  { filename: 'left_20241219_114416.jpg', dx: -80.39, dy: -24.22 },
  { filename: 'left_20241219_114417.jpg', dx: 75.91, dy: 14.56 },
  { filename: 'left_20241219_114418.jpg', dx: -108.06, dy: -32.35 },
];

// --- 2. データ処理 ---
const processImagesForPanorama = (logs: typeof RAW_LOGS) => {
  const result = [];
  let accumulatedX = 0;
  // 【改良点2】平均移動量の計算用にdxの絶対値を収集
  const dxValues: number[] = [];
  
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    
    accumulatedX -= log.dx;

    // 最初のデータ(dx=0)以外を収集
    if (i > 0) dxValues.push(Math.abs(log.dx));

    result.push({
      id: i,
      url: `${import.meta.env.BASE_URL}images/left/${log.filename}`,
      position: [accumulatedX, 0, 0] as [number, number, number],
      filename: log.filename
    });
  }

  // 平均移動量を計算（データがない場合はデフォルト値を使用）
  const avgDx = dxValues.length > 0 
    ? dxValues.reduce((a, b) => a + b, 0) / dxValues.length 
    : IMAGE_WIDTH;

  return { processedData: result, moveStep: avgDx };
};

// --- 3. 表示コンポーネント ---

// カメラ制御用コンポーネント（滑らかな移動を追加）
const CameraRig = ({ targetX }: { targetX: number }) => {
  const { camera, controls } = useThree();
  
  // 毎フレーム実行されるループ
  useFrame((_, delta) => {
    // 現在のX座標から目標のX座標へ、少しずつ近づける（線形補間: Lerp）
    // 第3引数の数値を大きくすると速く、小さくすると遅く（粘り強く）なります
    const dampSpeed = 8 * delta;
    
    // カメラの移動
    const currentX = camera.position.x;
    const nextX = THREE.MathUtils.lerp(currentX, targetX, dampSpeed);
    camera.position.setX(nextX);

    // Controls（視点ターゲット）の移動
    if (controls) {
      const orbit = controls as unknown as { target: THREE.Vector3; update: () => void };
      const currentTargetX = orbit.target.x;
      const nextTargetX = THREE.MathUtils.lerp(currentTargetX, targetX, dampSpeed);
      
      orbit.target.setX(nextTargetX);
      orbit.update();
    }
  });

  return null;
};

const ImagePanel = ({ url, position, index }: { 
  url: string, 
  position: [number, number, number], 
  index: number
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);

  useLayoutEffect(() => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.Material;
      material.depthWrite = false;
    }
  }, []);

  // 滑らかなカメラ移動に合わせて、毎フレーム透明度を計算する
  // (Propsでカメラ位置を受け取ると再レンダリングが頻発するため、refで直接操作する)
  useFrame(({ camera }) => {
    if (!meshRef.current) return;

    // カメラと画像の距離を計算
    const distance = Math.abs(position[0] - camera.position.x);
    
    // 距離に応じた目標透明度を決定
    const targetOpacity = distance < VISIBLE_THRESHOLD ? OPACITY_VISIBLE : OPACITY_INVISIBLE;

    // 現在の透明度から目標の透明度へ滑らかに変化させる（任意）
    // 瞬時に切り替えたい場合は meshRef.current.material.opacity = targetOpacity; だけでもOK
    const material = meshRef.current.material as THREE.Material;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.2);
    // 完全に透明になったら描画自体をスキップして負荷を下げる
    meshRef.current.visible = material.opacity > 0.01;
  });

  return (
    <group position={position} renderOrder={index}>
      <DreiImage 
        ref={meshRef}
        url={url} 
        scale={[IMAGE_WIDTH, IMAGE_HEIGHT]}
        transparent
        // 初期値
        opacity={OPACITY_INVISIBLE}
        side={THREE.DoubleSide}
      />
    </group>
  );
};

// --- 4. メインコンポーネント ---

export default function PanoramaView() {
  const { processedData, moveStep } = useMemo(() => processImagesForPanorama(RAW_LOGS), []);
  
  const minX = Math.min(...processedData.map(d => d.position[0]));
  const maxX = Math.max(...processedData.map(d => d.position[0]));
  const centerX = (minX + maxX) / 2;
  const totalWidth = Math.abs(maxX - minX) + IMAGE_WIDTH;

  // 目標位置（Target）を管理するState。
  // カメラの実際の座標（Current）はCameraRig内でLerp計算される。
  const [targetCameraX, setTargetCameraX] = useState(minX);

  const moveLeft = () => setTargetCameraX(prev => prev - moveStep);
  const moveRight = () => setTargetCameraX(prev => prev + moveStep);

  return (
    <div style={{ width: '100vw', height: '100vh', height: '100dvh', background: '#000', overflow: 'hidden', position: 'relative' }}>
      
      <Canvas>
        <PerspectiveCamera 
          makeDefault 
          position={[minX, 0, ADJUSTED_CAMERA_Z]} 
          fov={50} 
          far={100000} 
        />
        
        <OrbitControls 
          makeDefault
          enableDamping 
          dampingFactor={0.1}
          target={[minX, 0, 0]} 
          enablePan={false} 
          enableZoom={false} // スマホでの誤操作防止のためズームを無効化
          enableRotate={false} // 回転も無効化して視点を固定
        />

        {/* State(目標値)を渡して、内部で滑らかに移動させる */}
        <CameraRig targetX={targetCameraX} />

        <color attach="background" args={['#000']} />
        {/* 画像をくっきり見せるため環境光を強めに */}
        <ambientLight intensity={3} />

        <Grid 
          position={[centerX, -IMAGE_HEIGHT / 2 - 200, 0]} 
          args={[totalWidth * 2, IMAGE_HEIGHT * 2]} 
          cellColor="#333" 
          sectionColor="#555" 
          infiniteGrid 
          fadeDistance={50000}
          cellSize={100} 
          sectionSize={1000} 
        />

        {processedData.map((img, idx) => (
          <ImagePanel 
            key={img.id} 
            index={idx}
            url={img.url} 
            position={img.position}
            // ImagePanel自体がuseFrameでカメラ位置を取得するため、currentCameraXのProps渡しは不要
          />
        ))}
      </Canvas>

      {/* スマホ用UI配置 (左右分割) */}
      {/* 左ボタンエリア */}
      <div style={leftUiStyle} onClick={moveLeft}>
        <div style={arrowButtonStyle}>←</div>
      </div>
      
      {/* 右ボタンエリア */}
      <div style={rightUiStyle} onClick={moveRight}>
        <div style={arrowButtonStyle}>→</div>
      </div>

    </div>
  );
}

// --- CSS Styles ---
// 共通のボタンスタイル
const arrowButtonStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: 'rgba(50, 50, 50, 0.8)',
  color: '#fff',
  fontSize: '32px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(4px)',
  // スマホでのタップ時のハイライトを無効化
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none',
};

// 左側の操作エリアスタイル
const leftUiStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '30px',
  left: '20px',
  zIndex: 10,
  cursor: 'pointer',
  padding: '10px', // タップ領域を広げる
};

// 右側の操作エリアスタイル
const rightUiStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '30px',
  right: '20px',
  zIndex: 10,
  cursor: 'pointer',
  padding: '10px', // タップ領域を広げる
};