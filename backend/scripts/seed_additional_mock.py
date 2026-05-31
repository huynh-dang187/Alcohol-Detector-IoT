"""
Seed 20 additional mock violations into the SQLite DB using save_violation()
Run: python backend/scripts/seed_additional_mock.py
"""
import random
from datetime import datetime, timedelta
import os
import sys

# Ensure backend package path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from database import init_database, save_violation, get_db_connection

NAMES = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung', 'Hoàng Văn Dũng',
    'Phan Thị Hạnh', 'Võ Minh Huy', 'Đỗ Thị Kim', 'Bùi Văn Long', 'Ngô Thị Mai',
    'Trần Minh Nam', 'Lê Thị Oanh', 'Nguyễn Hồng Phúc', 'Huỳnh Anh Quân', 'Đặng Thị Hoa',
    'Phạm Văn Sơn', 'Trịnh Thị Thu', 'Vũ Đức Tài', 'Lê Văn Tùng', 'Nguyễn Thị Vân'
]

VEHICLES = [
    ('30A-11111', 'car'), ('30B-22222', 'motor'), ('51C-33333', 'car'), ('74D-44444', 'car'),
    ('29E-55555', 'motor'), ('36F-66666', 'car'), ('51G-77777', 'motor'), ('30H-88888', 'car'),
    ('29I-99999', 'motor'), ('74J-00000', 'car')
]

FINES = ['500.000đ', '1.000.000đ', '2.000.000đ', '4.000.000đ', '8.000.000đ', '16.000.000đ']
GENDERS = ['Nam', 'Nữ']

random.seed(42)

if __name__ == '__main__':
    init_database()
    inserted = 0
    for i in range(20):
        name = random.choice(NAMES)
        cccd = str(100000000000 + random.randint(0, 899999999999))
        age = random.randint(18, 65)
        gender = random.choice(GENDERS)
        plate, vehicle_type = random.choice(VEHICLES)
        # generate alcohol_level: between 0.02 and 0.45, sometimes very high to simulate extremes
        alcohol = round(random.choice([random.uniform(0.02, 0.25), random.uniform(0.25, 0.45)]) , 2)
        fine = random.choice(FINES)
        points = random.choice([2,4,6,10])
        gplx = ''

        violation = {
            'name': name,
            'cccd': cccd,
            'age': age,
            'gender': gender,
            'license_plate': plate,
            'vehicle_type': vehicle_type,
            'alcohol_level': alcohol,
            'fine_amount': fine,
            'points_deducted': points,
            'gplx_status': gplx
        }

        vid = save_violation(violation)
        if vid:
            inserted += 1

    print(f"Inserted {inserted} mock violations")
