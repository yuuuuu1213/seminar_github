import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// 必要なChart.jsのコンポーネントを登録
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

// 天気データ型
interface Weather {
  weather: { description: string; icon: string }[];
  main: { temp: number; humidity: number };
  wind: { speed: number };
}

// 予報データ型
interface Forecast {
  list: {
    dt: number;
    main: { temp: number; humidity: number };
  }[];
}

const Home: React.FC = () => {
  const [forecastData, setForecastData] = useState<Forecast | null>(null); // 週間予報データ
  const [currentWeather, setCurrentWeather] = useState<Weather | null>(null); // 今日の天気データ
  const [error, setError] = useState<string | null>(null); // エラー状態
  const [graphType, setGraphType] = useState<'temperature' | 'humidity'>('temperature'); // グラフの種類

  // 天気情報を取得する関数
  const fetchWeatherData = async () => {
    try {
      const apiKey = '70a0230768886186b9e5bbe42555918c'; // APIキーをhttps://openweathermap.org/api ここから会員登録して取得してください
      const city = 'Nagasaki'; // 長崎
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

      // 5日間予報データを取得
      const forecastResponse = await fetch(forecastUrl);
      if (!forecastResponse.ok) {
        throw new Error(`Forecast Error: ${forecastResponse.status}`);
      }
      const forecastData: Forecast = await forecastResponse.json();
      setForecastData(forecastData);

      // 今日の天気データを取得
      const currentWeatherResponse = await fetch(currentWeatherUrl);
      if (!currentWeatherResponse.ok) {
        throw new Error(`Current Weather Error: ${currentWeatherResponse.status}`);
      }
      const currentWeatherData: Weather = await currentWeatherResponse.json();
      setCurrentWeather(currentWeatherData);

      setError(null); // エラーをクリア
    } catch (err: any) {
      console.error('Error fetching weather data:', err);
      setError(err.message);
      setForecastData(null); // データをリセット
      setCurrentWeather(null);
    }
  };

  useEffect(() => {
    // 初回レンダリング時にデータ取得
    fetchWeatherData();
  }, []);

  // 折れ線グラフ用データを作成
  const generateGraphData = () => {
    if (!forecastData) return null;

    const labels = forecastData.list.map((item, index) => {
      const date = new Date(item.dt * 1000);

      // ラベルを一定間隔で表示（例: 3つおきに表示）
      if (index % 3 === 0) {
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      }
      return ''; // ラベルを空白にする
    });

    const values =
      graphType === 'temperature'
        ? forecastData.list.map((item) => item.main.temp) // 温度データ
        : forecastData.list.map((item) => item.main.humidity); // 湿度データ

    return {
      labels,
      datasets: [
        {
          label: graphType === 'temperature' ? 'Temperature (°C)' : 'Humidity (%)',
          data: values,
          borderColor: graphType === 'temperature' ? 'rgba(255, 0, 0, 1)' : 'rgba(0, 0, 255, 1)', // 赤 or 青
          backgroundColor:
            graphType === 'temperature' ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 0, 255, 0.2)', // 赤 or 青
          borderWidth: 2,
          tension: 0.2, // 線を滑らかに
        },
      ],
    };
  };

  // 折れ線グラフの軸オプション
  const chartOptions = {
    scales: {
      y: {
        ticks: {
          callback: (value: string | number) => {
            const numericValue = Number(value);
            return graphType === 'temperature'
            ? `${numericValue}°C`
            : `${numericValue}%`; // 温度または湿度の単位を表示
          },
        },
        title: {
          display: true,
          text: graphType === 'temperature' ? 'Temperature (°C)' : 'Humidity (%)', // Y軸タイトル
        },
      },
      x: {
        ticks: {
          autoSkip: false, // ラベルの間引きを手動で制御
          maxRotation: 45, // ラベルを斜めに表示
          minRotation: 0, // 必要に応じて調整可能
        },
        title: {
          display: true,
          text: 'Time', // X軸タイトル
        },
      },
    },
  };

  const graphData = generateGraphData();

  return (
    <div>
      <h2>Home Page</h2>
      <p>Weather Forecast for Nagasaki</p>

      {error ? (
        <p style={{ color: 'red' }}>Failed to fetch weather: {error}</p>
      ) : (
        <div>
          {/* 今日の天気の表示 */}
          {currentWeather ? (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3>Today's Weather</h3>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {/* 天気アイコン */}
                <img
                  src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                  alt={currentWeather.weather[0].description}
                  style={{ marginRight: '10px' }}
                />
                {/* 天気情報 */}
                <div>
                  <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
                    {currentWeather.weather[0].description}
                  </p>
                  <p>Temperature: {currentWeather.main.temp}°C</p>
                  <p>Humidity: {currentWeather.main.humidity}%</p>
                  <p>Wind Speed: {currentWeather.wind.speed} m/s</p>
                </div>
              </div>
            </div>
          ) : (
            <p>Loading current weather...</p>
          )}

          {/* グラフ切り替えボタン */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button
              onClick={() => setGraphType('temperature')}
              style={{
                marginRight: '10px',
                backgroundColor: graphType === 'temperature' ? '#FF0000' : '#ddd', // 温度ボタンを赤色
                color: graphType === 'temperature' ? '#fff' : '#000',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Temperature
            </button>
            <button
              onClick={() => setGraphType('humidity')}
              style={{
                backgroundColor: graphType === 'humidity' ? '#0000FF' : '#ddd', // 湿度ボタンを青色
                color: graphType === 'humidity' ? '#fff' : '#000',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Humidity
            </button>
          </div>

          {/* 折れ線グラフの表示 */}
          {graphData ? (
            <div>
              <h3>{graphType === 'temperature' ? '1-Week Temperature Forecast' : '1-Week Humidity Forecast'}</h3>
              <Line data={graphData} options={chartOptions} />
            </div>
          ) : (
            <p>Loading forecast data...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
