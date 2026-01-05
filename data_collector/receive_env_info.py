from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
import io

# --- 設定 ---
app = Flask(__name__)

# データベースファイルのパス設定
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'EnvData.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- データベースモデル (画像保存用) ---
class ImageStorage(db.Model):
    __tablename__ = 'images'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(100))
    upload_date = db.Column(db.String)
    # 画像の実データをバイナリとして保存するカラム
    data = db.Column(db.LargeBinary)

# --- データベースモデル(環境情報保存用) ---
class EnvironmentalInformation(db.Model):
    __tablename__ = 'environmental_information'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String)       # 送信元から送られてきた時刻
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    co2 = db.Column(db.Float)
    
# --- 画像受信エンドポイント ---
@app.route('/api/upload/image_db', methods=['POST'])
def upload_image_to_db():
    try:
        if 'file' not in request.files:
            return jsonify({"message": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"message": "No selected file"}), 400

        if file:
            # 1. ファイルの中身をバイナリデータとして読み込む
            file_data = file.read()
            
            # 2. データベースモデルを作成
            new_image = ImageStorage(
                filename=file.filename,
                upload_date=request.form.get('date', 'unknown'), # 日時は送信側で指定可能にするか、ここで生成
                data=file_data
            )
            
            # 3. 保存
            db.session.add(new_image)
            db.session.commit()
            
            return jsonify({"status": "success", "message": "Image saved to DB"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# --- 環境情報エンドポイント ---
@app.route('/api/data', methods=['POST'])
def receive_data():
    """
    ローカルPCから送信されたJSONデータを受け取り、DBに保存する
    """
    try:
        # 1. 送信されたJSONデータを取得
        data = request.get_json()
        
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        print(f"[LOG] Received data: {data}")

        # 2. データベースへ保存
        new_record = EnvironmentalInformation(
            date=data['date'],
            temperature=data['temperature'],
            humidity=data['humidity'],
            co2=data['co2']
        )
        
        db.session.add(new_record)
        db.session.commit()
        
        return jsonify({"status": "success", "message": "Data saved"}), 201

    except KeyError as e:
        return jsonify({"status": "error", "message": f"Missing key: {e}"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
# --- 追加：画像一覧を取得するAPI ---
@app.route('/api/images', methods=['GET'])
def get_images():
    images = ImageStorage.query.order_by(ImageStorage.id).all()
    # ファイル名から'left'か'right'かを判別し、IDと一緒に返す
    image_list = [{
        "id": img.id,
        "side": 'left' if 'left' in img.filename.lower() else 'right',
        "url": f"https://unradiant-wadable-freeman.ngrok-free.dev/api/image/{img.id}"
    } for img in images]
    return jsonify(image_list)

# --- 追加：画像バイナリを返すAPI ---
from flask import send_file
@app.route('/api/image/<int:image_id>')
def get_image_data(image_id):
    img = ImageStorage.query.get_or_404(image_id)
    return send_file(io.BytesIO(img.data), mimetype='image/jpeg')

# --- 初期化とサーバー起動 ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("[LOG] Database initialized.")
    
    # host='0.0.0.0' にしないと外部からアクセスできません
    # port=5000 で待ち受けます
    app.run(host='0.0.0.0', port=5000)