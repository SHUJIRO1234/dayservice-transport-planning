#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
荒川区及び近隣エリアの30名の利用者データと5台の車両データを生成
"""

import csv
import random

# 荒川区及び近隣エリアの実在する地名と座標
arakawa_locations = [
    {"area": "荒川区西日暮里", "lat": 35.7322, "lng": 139.7669},
    {"area": "荒川区東日暮里", "lat": 35.7289, "lng": 139.7707},
    {"area": "荒川区南千住", "lat": 35.7308, "lng": 139.7991},
    {"area": "荒川区町屋", "lat": 35.7362, "lng": 139.7831},
    {"area": "荒川区荒川", "lat": 35.7365, "lng": 139.7881},
    {"area": "荒川区東尾久", "lat": 35.7445, "lng": 139.7742},
    {"area": "荒川区西尾久", "lat": 35.7456, "lng": 139.7658},
    {"area": "台東区根岸", "lat": 35.7251, "lng": 139.7778},
    {"area": "台東区下谷", "lat": 35.7198, "lng": 139.7809},
    {"area": "北区田端", "lat": 35.7381, "lng": 139.7609},
    {"area": "北区東田端", "lat": 35.7411, "lng": 139.7649},
    {"area": "足立区千住", "lat": 35.7489, "lng": 139.8050},
    {"area": "足立区千住旭町", "lat": 35.7456, "lng": 139.8011},
    {"area": "墨田区東向島", "lat": 35.7289, "lng": 139.8167},
]

# 日本人の姓と名
surnames = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
            "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
            "山崎", "森", "池田", "橋本", "阿部", "石川", "前田", "藤田", "後藤", "長谷川"]

male_names = ["太郎", "次郎", "三郎", "健太", "大輔", "一郎", "勇", "誠", "隆", "修",
              "博", "明", "茂", "実", "進", "正", "武", "昭", "清", "豊"]

female_names = ["花子", "美咲", "由美", "恵子", "陽子", "久美子", "洋子", "幸子", "和子", "京子",
                "良子", "明子", "千代", "春子", "秋子", "夏子", "冬子", "愛", "優子", "真理子"]

# 30名の利用者データを生成
users = []
for i in range(1, 31):
    user_id = f"U{i:03d}"
    
    # 性別をランダムに決定
    is_male = random.choice([True, False])
    surname = surnames[i-1]
    name = male_names[i % len(male_names)] if is_male else female_names[i % len(female_names)]
    full_name = f"{surname} {name}"
    
    # 住所を選択
    location = random.choice(arakawa_locations)
    # 座標に少しランダム性を加える（同じ地域内でも少し分散させる）
    lat = location["lat"] + random.uniform(-0.005, 0.005)
    lng = location["lng"] + random.uniform(-0.005, 0.005)
    
    # 番地をランダム生成
    chome = random.randint(1, 5)
    banchi = random.randint(1, 20)
    go = random.randint(1, 15)
    address = f"{location['area']}{chome}-{banchi}-{go}"
    
    # 電話番号
    phone = f"03-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    
    # 車椅子対応（約30%の確率）
    wheelchair = "TRUE" if random.random() < 0.3 else "FALSE"
    
    # 備考（一部の利用者のみ）
    notes_options = ["", "", "", "玄関まで介助必要", "2階まで介助必要", "認知症あり"]
    notes = random.choice(notes_options)
    
    users.append({
        "user_id": user_id,
        "name": full_name,
        "address": address,
        "phone": phone,
        "wheelchair": wheelchair,
        "notes": notes,
        "lat": round(lat, 6),
        "lng": round(lng, 6)
    })

# 利用予定データを生成（全員が今日利用）
schedules = []
for user in users:
    schedules.append({
        "user_id": user["user_id"],
        "date": "2025-10-14",
        "pickup_time": f"08:{random.choice(['00', '15', '30', '45'])}",
        "return_time": "16:00",
        "status": "予定"
    })

# 5台の車両データを生成
vehicles = [
    {
        "vehicle_id": "V001",
        "vehicle_name": "送迎車1号",
        "capacity": 8,
        "wheelchair_capacity": 2,
        "driver_name": "佐藤 花子"
    },
    {
        "vehicle_id": "V002",
        "vehicle_name": "送迎車2号",
        "capacity": 6,
        "wheelchair_capacity": 1,
        "driver_name": "中村 次郎"
    },
    {
        "vehicle_id": "V003",
        "vehicle_name": "送迎車3号",
        "capacity": 8,
        "wheelchair_capacity": 2,
        "driver_name": "田中 三郎"
    },
    {
        "vehicle_id": "V004",
        "vehicle_name": "送迎車4号",
        "capacity": 7,
        "wheelchair_capacity": 1,
        "driver_name": "山田 美咲"
    },
    {
        "vehicle_id": "V005",
        "vehicle_name": "送迎車5号",
        "capacity": 6,
        "wheelchair_capacity": 1,
        "driver_name": "鈴木 健太"
    }
]

# 事業所情報（荒川区内）
facility = {
    "facility_name": "デイサービスさくら",
    "address": "荒川区西日暮里2-10-5",
    "phone": "03-9876-5432",
    "lat": 35.7320,
    "lng": 139.7670
}

# CSVファイルに書き出し
with open('/home/ubuntu/dayservice-transport-app/sample_data_30/users.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["user_id", "name", "address", "phone", "wheelchair", "notes", "lat", "lng"])
    writer.writeheader()
    writer.writerows(users)

with open('/home/ubuntu/dayservice-transport-app/sample_data_30/schedules.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["user_id", "date", "pickup_time", "return_time", "status"])
    writer.writeheader()
    writer.writerows(schedules)

with open('/home/ubuntu/dayservice-transport-app/sample_data_30/vehicles.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["vehicle_id", "vehicle_name", "capacity", "wheelchair_capacity", "driver_name"])
    writer.writeheader()
    writer.writerows(vehicles)

with open('/home/ubuntu/dayservice-transport-app/sample_data_30/facility.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["facility_name", "address", "phone", "lat", "lng"])
    writer.writeheader()
    writer.writerow(facility)

print("✅ 30名の利用者データと5台の車両データを生成しました")
print(f"利用者数: {len(users)}名")
print(f"車椅子対応が必要な利用者: {sum(1 for u in users if u['wheelchair'] == 'TRUE')}名")
print(f"車両数: {len(vehicles)}台")
print(f"総定員: {sum(v['capacity'] for v in vehicles)}名")
print(f"総車椅子対応可能数: {sum(v['wheelchair_capacity'] for v in vehicles)}台")

