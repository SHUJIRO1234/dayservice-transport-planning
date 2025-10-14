#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
曜日ごとの利用者データを生成するスクリプト
週1回〜週5回利用など、さまざまな利用パターンを想定
"""

import csv
import random
from datetime import datetime

# 荒川区及び近隣エリアの住所リスト
addresses = [
    ("荒川区町屋1-8-14", 35.7361, 139.7831),
    ("荒川区町屋3-8-2", 35.7345, 139.7815),
    ("荒川区町屋4-20-9", 35.7328, 139.7798),
    ("荒川区西尾久3-20-14", 35.7412, 139.7723),
    ("荒川区西尾久4-5-1", 35.7398, 139.7705),
    ("荒川区西尾久4-11-15", 35.7385, 139.7692),
    ("荒川区東尾久1-17-11", 35.7445, 139.7768),
    ("荒川区東尾久3-11-14", 35.7428, 139.7752),
    ("荒川区東尾久5-9-2", 35.7412, 139.7735),
    ("荒川区南千住1-2-11", 35.7298, 139.7945),
    ("荒川区南千住1-10-13", 35.7285, 139.7928),
    ("荒川区南千住4-10-3", 35.7268, 139.7912),
    ("荒川区南千住5-4-11", 35.7252, 139.7895),
    ("荒川区西日暮里4-7-4", 35.7312, 139.7678),
    ("荒川区東日暮里4-6-10", 35.7295, 139.7662),
    ("荒川区荒川4-8-2", 35.7378, 139.7845),
    ("北区田端3-14-6", 35.7378, 139.7612),
    ("北区田端4-12-12", 35.7362, 139.7595),
    ("北区田端5-5-4", 35.7345, 139.7578),
    ("北区田端5-2-5", 35.7328, 139.7562),
    ("台東区根岸2-19-5", 35.7212, 139.7745),
    ("台東区根岸3-9-12", 35.7195, 139.7728),
    ("台東区根岸4-18-8", 35.7178, 139.7712),
    ("台東区根岸5-8-9", 35.7162, 139.7695),
    ("台東区下谷2-10-15", 35.7145, 139.7678),
    ("墨田区東向島3-3-9", 35.7428, 139.8112),
    ("墨田区東向島3-15-8", 35.7412, 139.8095),
    ("墨田区東向島5-20-11", 35.7395, 139.8078),
    ("足立区千住1-19-9", 35.7478, 139.8045),
    ("足立区千住旭町4-16-10", 35.7462, 139.8028),
    ("台東区台東2-19-5", 35.7095, 139.7812),
    ("台東区台東4-12-12", 35.7078, 139.7795),
    ("足立区千住2-14-6", 35.7445, 139.8012),
    ("足立区千住3-8-9", 35.7428, 139.7995),
    ("墨田区東向島1-5-3", 35.7478, 139.8145),
    ("墨田区東向島2-11-7", 35.7462, 139.8128),
]

# 姓と名のリスト
last_names = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
              "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
              "山崎", "森", "池田", "橋本", "阿部", "石川", "前田", "藤田", "後藤", "長谷川",
              "村上", "近藤", "石井", "坂本", "遠藤", "青木", "藤井", "西村", "福田", "太田",
              "三浦", "岡田", "藤原", "竹内", "金子", "中島", "小川", "中野", "原田", "和田"]

first_names_male = ["太郎", "次郎", "三郎", "健太", "大輔", "隆", "修", "茂", "武", "昭",
                    "清", "誠", "勇", "博", "明", "実", "正", "勝", "進", "豊"]

first_names_female = ["花子", "美咲", "由美", "久美子", "幸子", "良子", "明子", "実", "秋子", "夏子",
                      "真理子", "恵子", "京子", "美咲", "陽子", "裕子", "智子", "直子", "和子", "洋子"]

# 備考リスト
notes = [
    "",
    "",
    "",
    "認知症あり",
    "玄関まで介助必要",
    "2階まで介助必要",
]

# 曜日リスト
weekdays = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"]

# 利用パターン（どの曜日に利用するか）
usage_patterns = [
    [0],  # 月曜日のみ
    [1],  # 火曜日のみ
    [2],  # 水曜日のみ
    [3],  # 木曜日のみ
    [4],  # 金曜日のみ
    [0, 3],  # 月・木
    [1, 4],  # 火・金
    [0, 2, 4],  # 月・水・金
    [1, 3],  # 火・木
    [0, 1, 2, 3, 4],  # 月〜金（週5回）
]

def generate_weekly_users():
    """曜日ごとの利用者データを生成"""
    
    # 全利用者プール（最大100名）
    all_users = []
    user_id = 1
    
    # 各利用パターンごとに利用者を生成
    for pattern in usage_patterns:
        # このパターンで10〜15名の利用者を生成
        num_users = random.randint(10, 15)
        
        for _ in range(num_users):
            # ランダムに性別を決定
            is_male = random.choice([True, False])
            last_name = random.choice(last_names)
            first_name = random.choice(first_names_male if is_male else first_names_female)
            
            # ランダムに住所を選択
            address, lat, lng = random.choice(addresses)
            
            # 車椅子対応（30%の確率）
            wheelchair = random.random() < 0.3
            
            # 備考
            note = random.choice(notes)
            
            # 送迎時刻（8:00〜8:45の間でランダム）
            pickup_hour = 8
            pickup_minute = random.choice([0, 15, 30, 45])
            
            user = {
                "id": user_id,
                "name": f"{last_name} {first_name}",
                "address": address,
                "lat": lat,
                "lng": lng,
                "wheelchair": wheelchair,
                "note": note,
                "pickup_time": f"{pickup_hour:02d}:{pickup_minute:02d}",
                "return_time": "16:00",
                "usage_pattern": pattern  # どの曜日に利用するか
            }
            
            all_users.append(user)
            user_id += 1
    
    # 曜日ごとのデータを生成
    weekly_data = {}
    
    for day_index, weekday in enumerate(weekdays):
        # この曜日に利用する利用者を抽出
        day_users = [u for u in all_users if day_index in u["usage_pattern"]]
        
        # 最大30名に制限
        if len(day_users) > 30:
            day_users = random.sample(day_users, 30)
        
        weekly_data[weekday] = day_users
    
    return weekly_data

def save_weekly_data(weekly_data):
    """曜日ごとのデータをCSVファイルに保存"""
    
    import os
    os.makedirs("weekly_data", exist_ok=True)
    
    for weekday, users in weekly_data.items():
        filename = f"weekly_data/{weekday}.csv"
        
        with open(filename, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["ID", "氏名", "住所", "緯度", "経度", "車椅子", "備考", "送迎時刻", "帰宅時刻"])
            
            for user in users:
                writer.writerow([
                    user["id"],
                    user["name"],
                    user["address"],
                    user["lat"],
                    user["lng"],
                    "要" if user["wheelchair"] else "",
                    user["note"],
                    user["pickup_time"],
                    user["return_time"]
                ])
        
        print(f"{weekday}: {len(users)}名のデータを生成しました")

def save_as_javascript(weekly_data):
    """JavaScriptファイルとして保存"""
    
    js_content = "// 曜日ごとの利用者データ\n"
    js_content += "export const weeklyData = {\n"
    
    for weekday, users in weekly_data.items():
        js_content += f'  "{weekday}": [\n'
        
        for user in users:
            js_content += "    {\n"
            js_content += f'      id: {user["id"]},\n'
            js_content += f'      name: "{user["name"]}",\n'
            js_content += f'      address: "{user["address"]}",\n'
            js_content += f'      lat: {user["lat"]},\n'
            js_content += f'      lng: {user["lng"]},\n'
            js_content += f'      wheelchair: {str(user["wheelchair"]).lower()},\n'
            js_content += f'      note: "{user["note"]}",\n'
            js_content += f'      pickupTime: "{user["pickup_time"]}",\n'
            js_content += f'      returnTime: "{user["return_time"]}",\n'
            js_content += "    },\n"
        
        js_content += "  ],\n"
    
    js_content += "};\n"
    
    # 事業所情報も追加
    js_content += "\n// 事業所情報\n"
    js_content += "export const facility = {\n"
    js_content += '  name: "デイサービスさくら",\n'
    js_content += '  address: "荒川区西日暮里2-10-5",\n'
    js_content += "  lat: 35.7328,\n"
    js_content += "  lng: 139.7645,\n"
    js_content += "};\n"
    
    # 車両情報も追加
    js_content += "\n// 車両情報\n"
    js_content += "export const vehicles = [\n"
    vehicles_data = [
        {"id": 1, "name": "送迎車1号", "driver": "佐藤 花子", "capacity": 8, "wheelchairCapacity": 2},
        {"id": 2, "name": "送迎車2号", "driver": "中村 次郎", "capacity": 6, "wheelchairCapacity": 1},
        {"id": 3, "name": "送迎車3号", "driver": "田中 三郎", "capacity": 8, "wheelchairCapacity": 2},
        {"id": 4, "name": "送迎車4号", "driver": "山田 美咲", "capacity": 7, "wheelchairCapacity": 1},
        {"id": 5, "name": "送迎車5号", "driver": "鈴木 健太", "capacity": 6, "wheelchairCapacity": 1},
    ]
    
    for vehicle in vehicles_data:
        js_content += "  {\n"
        js_content += f'    id: {vehicle["id"]},\n'
        js_content += f'    name: "{vehicle["name"]}",\n'
        js_content += f'    driver: "{vehicle["driver"]}",\n'
        js_content += f'    capacity: {vehicle["capacity"]},\n'
        js_content += f'    wheelchairCapacity: {vehicle["wheelchairCapacity"]},\n'
        js_content += "  },\n"
    
    js_content += "];\n"
    
    with open("transport-web/src/weeklyData.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    print("\nJavaScriptファイルを生成しました: transport-web/src/weeklyData.js")

if __name__ == "__main__":
    print("曜日ごとの利用者データを生成しています...")
    weekly_data = generate_weekly_users()
    save_weekly_data(weekly_data)
    save_as_javascript(weekly_data)
    print("\n完了しました！")

