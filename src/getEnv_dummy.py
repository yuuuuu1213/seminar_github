import time
import random
import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# --- 設定 ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///EnvData.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# データ保存間隔（秒）
INTERVAL_SECONDS = 5 

# --- データベースモデル ---
class TemperatureMeasurement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    co2 = db.Column(db.Float)

# --- ダミーデータ生成と保存処理 ---
def generate_and_save_dummy_data():
    """
    ダミーデータを生成し、データベースに保存するループ処理
    """
    print(f"[LOG] Starting dummy data generation (Interval: {INTERVAL_SECONDS}s)...")
    
    try:
        while True:
            # 1. ダミーデータの生成
            # 現在時刻
            current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # ランダムな環境データ（現実的な範囲で変動させる）
            # 温度: 20.0〜30.0度の間
            dummy_temp = round(random.uniform(20.0, 30.0), 2)
            # 湿度: 40.0〜60.0%の間
            dummy_hum = round(random.uniform(40.0, 60.0), 2)
            # CO2: 400〜1000ppmの間
            dummy_co2 = round(random.uniform(400.0, 1000.0), 2)

            print(f"[DEBUG] Generated: Date={current_time}, Temp={dummy_temp}, Hum={dummy_hum}, CO2={dummy_co2}")

            # 2. データベースへの保存
            try:
                new_record = TemperatureMeasurement(
                    date=current_time,
                    temperature=dummy_temp,
                    humidity=dummy_hum,
                    co2=dummy_co2
                )
                db.session.add(new_record)
                db.session.commit()
                print("[LOG] Data committed to database.")
            
            except Exception as db_error:
                db.session.rollback() # エラー時はロールバック
                print(f"[ERROR] Database commit failed: {db_error}")

            # 3. 待機
            time.sleep(INTERVAL_SECONDS)

    except KeyboardInterrupt:
        print("\n[LOG] Process stopped by user.")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")

# --- データベース初期化 ---
# Flask 2.3以降や新しいコンテキスト管理に対応するため、明示的にapp_context内で作成します
def setup_database():
    with app.app_context():
        db.create_all()
        print("[LOG] Database initialized.")

# --- メイン実行ブロック ---
if __name__ == '__main__':
    # データベースの初期化
    setup_database()
    
    # アプリケーションコンテキスト内でデータ生成ループを実行
    # (Flask-SQLAlchemyを使うために必要)
    with app.app_context():
        generate_and_save_dummy_data()