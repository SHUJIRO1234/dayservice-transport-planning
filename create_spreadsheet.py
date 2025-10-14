"""
デイサービス送迎計画アプリ用のGoogleスプレッドシート作成スクリプト

このスクリプトは、サンプルデータを含むGoogleスプレッドシートを作成します。
実行には Google Sheets API の認証が必要です。
"""

import csv
from datetime import datetime, timedelta

# サンプルデータの定義

# 1. 利用者マスタ
users_data = [
    ["user_id", "name", "address", "phone", "wheelchair", "notes"],
    ["U001", "山田 太郎", "東京都世田谷区桜新町1-2-3", "03-1234-5678", "FALSE", ""],
    ["U002", "鈴木 花子", "東京都世田谷区桜新町1-5-8", "03-1234-5679", "TRUE", "車椅子対応必要"],
    ["U003", "田中 一郎", "東京都世田谷区桜新町2-3-12", "03-1234-5680", "FALSE", ""],
    ["U004", "高橋 美咲", "東京都世田谷区桜新町2-8-5", "03-1234-5681", "FALSE", "玄関まで介助必要"],
    ["U005", "伊藤 健太", "東京都世田谷区桜新町3-1-9", "03-1234-5682", "TRUE", "車椅子対応必要"],
]

# 2. 利用予定（今日の日付で作成）
today = datetime.now().strftime("%Y-%m-%d")
schedules_data = [
    ["user_id", "date", "pickup_time", "return_time", "status"],
    ["U001", today, "08:30", "16:00", "予定"],
    ["U002", today, "08:45", "16:00", "予定"],
    ["U003", today, "08:30", "16:00", "予定"],
    ["U004", today, "09:00", "16:00", "予定"],
    ["U005", today, "08:45", "16:00", "予定"],
]

# 3. 車両マスタ
vehicles_data = [
    ["vehicle_id", "vehicle_name", "capacity", "wheelchair_capacity", "driver_name"],
    ["V001", "送迎車1号", "8", "2", "佐藤 花子"],
    ["V002", "送迎車2号", "6", "1", "中村 次郎"],
]

# 4. 事業所情報
facility_data = [
    ["facility_name", "address", "phone"],
    ["デイサービスさくら", "東京都世田谷区桜新町2-10-5", "03-9876-5432"],
]

# CSVファイルとして出力（スプレッドシートへのインポート用）
def create_csv_files():
    """各シートのデータをCSVファイルとして出力"""
    
    with open('/home/ubuntu/dayservice-transport-app/users.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(users_data)
    
    with open('/home/ubuntu/dayservice-transport-app/schedules.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(schedules_data)
    
    with open('/home/ubuntu/dayservice-transport-app/vehicles.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(vehicles_data)
    
    with open('/home/ubuntu/dayservice-transport-app/facility.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(facility_data)
    
    print("✓ CSVファイルを作成しました")
    print("  - users.csv")
    print("  - schedules.csv")
    print("  - vehicles.csv")
    print("  - facility.csv")

if __name__ == "__main__":
    create_csv_files()

