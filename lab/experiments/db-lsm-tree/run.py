"""LSM-tree trên RocksDB: ghi vào memtable, flush ra file SST ở L0, ghi đè và xóa tạo thêm bản ghi trên đĩa, compaction gộp lại.

Chạy: python -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python run.py
"""
import glob
import os
import platform
import shutil
import sys
import tempfile
from datetime import datetime, timezone

from rocksdict import Options, Rdict

N = 100_000


def key(i: int) -> bytes:
    return f"req:{i:06d}".encode()


def value(i: int, status: str) -> bytes:
    return f'{{"id":{i},"status":"{status}","title":"Yêu cầu số {i}"}}'.encode()


def show_files(db: Rdict, label: str) -> None:
    files = sorted(db.live_files(), key=lambda f: (f["level"], f["name"]))
    total = sum(f["size"] for f in files)
    print(f"-- {label}: {len(files)} file SST, tổng {total:,} byte")
    for f in files:
        print(f"   {f['name']:<14} level {f['level']}  entries {f['num_entries']:>7,}  deletions {f['num_deletions']:>7,}  size {f['size']:>9,}")


d = tempfile.mkdtemp(prefix="lab-lsm-")
opt = Options(raw_mode=True)
opt.create_if_missing(True)
opt.set_disable_auto_compactions(True)
db = Rdict(d, opt)

version_line = next(l.strip() for l in open(sorted(glob.glob(d + "/OPTIONS-*"))[-1]) if "rocksdb_version" in l)
print("# LSM-tree trên RocksDB")
print(f"Thư viện: rocksdict 0.3.25, {version_line}")
print(f"Python {platform.python_version()} trên {platform.system()} {platform.machine()}")
print(f"Thời điểm chạy: {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
print("-- Tắt compaction tự động để quan sát từng bước; bước 5 gọi compaction thủ công.")

print("\n## 1. Ghi 100.000 khóa: dữ liệu nằm trong memtable, chưa có file SST")
for i in range(N):
    db[key(i)] = value(i, "pending")
print(f"-- rocksdb.cur-size-all-mem-tables = {db.property_int_value('rocksdb.cur-size-all-mem-tables'):,} byte")
show_files(db, "trước flush")
print(f"-- đọc {key(42).decode()} → {db[key(42)].decode()}")

print("\n## 2. Flush: memtable được ghi thành một file SST ở level 0")
db.flush()
show_files(db, "sau flush lần 1")

print("\n## 3. Ghi đè cả 100.000 khóa rồi flush: bản cũ vẫn nằm trên đĩa")
for i in range(N):
    db[key(i)] = value(i, "approved")
db.flush()
show_files(db, "sau flush lần 2")
print(f"-- đọc {key(42).decode()} → {db[key(42)].decode()}")

print("\n## 4. Xóa 50.000 khóa rồi flush: xóa được ghi thành tombstone")
for i in range(0, N, 2):
    del db[key(i)]
db.flush()
show_files(db, "sau flush lần 3")
print(f"-- đọc {key(42).decode()} (đã xóa) → {db.get(key(42))}")
print(f"-- đọc {key(43).decode()} → {db[key(43)].decode()}")

print("\n## 5. Compaction: gộp ba file, giữ bản mới nhất, bỏ bản bị ghi đè và khóa đã xóa")
db.compact_range(None, None)
show_files(db, "sau compaction")
print(f"-- số khóa thực tế: {sum(1 for _ in db.keys()):,}")
print(f"-- đọc {key(43).decode()} → {db[key(43)].decode()}")

db.close()
Rdict.destroy(d)
shutil.rmtree(d, ignore_errors=True)
