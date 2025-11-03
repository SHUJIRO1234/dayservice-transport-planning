#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
80名のサンプル利用者データを生成するスクリプト
曜日ごとに人数を制御（最大定員33名）
"""

import json
import random
from datetime import datetime

# 日本の姓と名のリスト
surnames = [
    "佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤",
    "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水",
    "山崎", "森", "池田", "橋本", "阿部", "石川", "山下", "中島", "石井", "小川",
    "前田", "岡田", "長谷川", "藤田", "後藤", "近藤", "村上", "遠藤", "青木", "坂本",
    "福田", "西村", "太田", "三浦", "藤井", "岡本", "松田", "中川", "中野", "原田",
    "竹内", "小野", "田村", "金子", "和田", "中山", "石田", "上田", "森田", "原",
    "柴田", "谷口", "内田", "宮崎", "高木", "安藤", "今井", "大野", "平野", "河野",
    "藤原", "岩崎", "菊地", "酒井", "横山", "宮本", "工藤", "杉山", "村田", "大塚"
]

given_names_male = [
    "太郎", "次郎", "三郎", "健", "誠", "勇", "武", "隆", "博", "明",
    "修", "茂", "勝", "進", "実", "豊", "浩", "正", "弘", "昭"
]

given_names_female = [
    "花子", "幸子", "恵子", "陽子", "京子", "美子", "良子", "和子", "洋子", "真理子",
    "由美子", "直子", "裕子", "智子", "明子", "優子", "愛子", "麻衣", "さくら", "あやめ"
]

# 東京23区の住所リスト
addresses = [
    "荒川区西日暮里1-10-13",
    "荒川区東日暮里4-6-10",
    "荒川区東尾久1-17-11",
    "足立区千住旭町4-16-10",
    "足立区千住3-8-9",
    "北区田端5-2-5",
    "北区赤羽1-12-8",
    "台東区東上野5-20-11",
    "台東区浅草2-3-1",
    "墨田区東向島5-20-11",
    "墨田区押上1-1-2",
    "江東区亀戸6-31-1",
    "江東区豊洲3-2-20",
    "品川区大井1-14-1",
    "品川区西五反田2-11-8",
    "目黒区自由が丘1-26-5",
    "目黒区中目黒3-6-1",
    "大田区蒲田5-13-26",
    "大田区池上6-1-1",
    "世田谷区三軒茶屋2-11-20",
    "世田谷区成城6-5-34",
    "渋谷区渋谷1-12-2",
    "渋谷区代々木1-38-2",
    "中野区中野5-52-15",
    "中野区東中野4-9-1",
    "杉並区高円寺南4-27-11",
    "杉並区荻窪5-15-13",
    "豊島区池袋2-40-13",
    "豊島区巣鴨3-34-1",
    "板橋区板橋2-66-1"
]

# ピックアップ時間のリスト
pickup_times = ["08:00", "08:15", "08:30", "08:45", "09:00", "09:15"]

# メモのリスト
notes_options = [
    "玄関まで介助必要",
    "2階まで介助必要",
    "認知症あり",
    "玄関まであり",
    ""
]

def generate_user_id():
    """ユニークなIDを生成"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    random_num = random.randint(1000, 9999)
    return f"user_{timestamp}_{random_num}"

def generate_users_with_weekday_control(total_count=80):
    """
    曜日ごとの人数を制御してサンプルデータを生成
    
    目標人数:
    - 月曜日: 33名
    - 火曜日: 30名
    - 水曜日: 28名
    - 木曜日: 32名
    - 金曜日: 31名
    - 土曜日: 25名
    """
    users = []
    
    # 曜日ごとの目標人数
    target_counts = {
        'monday': 33,
        'tuesday': 30,
        'wednesday': 28,
        'thursday': 32,
        'friday': 31,
        'saturday': 25
    }
    
    # 各曜日に割り当てる利用者のインデックスリストを作成
    weekday_assignments = {day: [] for day in target_counts.keys()}
    
    # 各利用者を1-3曜日にランダムに割り当て
    for i in range(total_count):
        # 利用曜日数（1-3曜日）
        num_days = random.randint(1, 3)
        
        # 利用可能な曜日をランダムに選択
        available_days = list(target_counts.keys())
        selected_days = random.sample(available_days, num_days)
        
        for day in selected_days:
            weekday_assignments[day].append(i)
    
    # 各曜日の人数を目標に調整
    for day, target in target_counts.items():
        current_count = len(weekday_assignments[day])
        
        if current_count < target:
            # 不足している場合、他の利用者を追加
            diff = target - current_count
            available_users = [i for i in range(total_count) if i not in weekday_assignments[day]]
            if available_users:
                additional_users = random.sample(available_users, min(diff, len(available_users)))
                weekday_assignments[day].extend(additional_users)
        
        elif current_count > target:
            # 超過している場合、ランダムに削除
            diff = current_count - target
            weekday_assignments[day] = random.sample(weekday_assignments[day], target)
    
    # 利用者データを生成
    for i in range(total_count):
        # 性別をランダムに選択
        is_male = random.choice([True, False])
        surname = random.choice(surnames)
        given_name = random.choice(given_names_male if is_male else given_names_female)
        name = f"{surname} {given_name}"
        
        # 車椅子利用者は20%
        wheelchair = random.random() < 0.2
        
        # 住所、ピックアップ時間、メモをランダムに選択
        address = random.choice(addresses)
        pickup_time = random.choice(pickup_times)
        notes = random.choice(notes_options)
        
        # この利用者が登録されている曜日を確認
        user_weekdays = {
            'monday': i in weekday_assignments['monday'],
            'tuesday': i in weekday_assignments['tuesday'],
            'wednesday': i in weekday_assignments['wednesday'],
            'thursday': i in weekday_assignments['thursday'],
            'friday': i in weekday_assignments['friday'],
            'saturday': i in weekday_assignments['saturday'],
            'sunday': False
        }
        
        user = {
            'id': generate_user_id(),
            'name': name,
            'address': address,
            'wheelchair': wheelchair,
            'pickupTime': pickup_time,
            'notes': notes,
            **user_weekdays,
            'serviceCode': '321111',
            'serviceDuration': {
                'monday': '7-8h',
                'tuesday': '7-8h',
                'wednesday': '7-8h',
                'thursday': '7-8h',
                'friday': '7-8h',
                'saturday': '7-8h',
                'sunday': '7-8h'
            },
            'additionalServices': {
                'bathing': random.choice([True, False]),
                'training': random.choice([True, False]),
                'nutrition': random.choice([True, False]),
                'oral': random.choice([True, False])
            },
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        users.append(user)
    
    return users

def main():
    """メイン処理"""
    users = generate_users_with_weekday_control(80)
    
    # JSON形式で出力
    output = {
        'userMaster': users,
        'generated_at': datetime.now().isoformat(),
        'total_count': len(users)
    }
    
    # ファイルに保存
    output_file = '/home/ubuntu/dayservice-transport-app/sample_users_80_v2.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(users)}名のサンプルデータを生成しました")
    print(f"📁 ファイル: {output_file}")
    
    # 曜日ごとの人数を集計
    weekday_names = {
        'monday': '月曜日',
        'tuesday': '火曜日',
        'wednesday': '水曜日',
        'thursday': '木曜日',
        'friday': '金曜日',
        'saturday': '土曜日',
        'sunday': '日曜日'
    }
    
    print("\n📊 曜日ごとの利用者数:")
    for day_en, day_jp in weekday_names.items():
        count = sum(1 for user in users if user[day_en])
        print(f"  {day_jp}: {count}名")
    
    # 車椅子利用者数
    wheelchair_count = sum(1 for user in users if user['wheelchair'])
    print(f"\n♿ 車椅子利用者: {wheelchair_count}名")

if __name__ == '__main__':
    main()

