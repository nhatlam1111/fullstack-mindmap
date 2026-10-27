# Thử nghiệm: db-lsm-tree

**Câu hỏi.** Trong một storage engine LSM-tree, ghi, ghi đè và xóa đi đâu? Compaction làm gì với các bản cũ?

**Môi trường.** RocksDB 9.8.4 qua thư viện Python `rocksdict` 0.3.25 (binding cộng đồng, gói sẵn RocksDB), Python 3.13.16 trên Linux x86_64, trong môi trường build của Claude. Chạy ngày 16/10/2026.

**Chạy lại.**

```bash
cd lab/experiments/db-lsm-tree
python -m venv .venv
.venv/bin/pip install -r requirements.txt   # Windows: .venv\Scripts\pip
.venv/bin/python run.py
```

**Kết luận từ kết quả dưới đây.**

- Ghi 100.000 khóa: chưa có file SST nào, memtable chiếm 10.487.808 byte; đọc khóa vẫn trả về giá trị (từ memtable).
- Flush lần 1 tạo 1 file SST ở level 0: 100.000 entries, 1.583.440 byte.
- Ghi đè cả 100.000 khóa rồi flush: 2 file ở level 0, mỗi file 100.000 entries, tổng 3.172.124 byte; đọc trả giá trị mới (`approved`). Bản cũ vẫn nằm trong file thứ nhất.
- Xóa 50.000 khóa rồi flush: file thứ ba có 50.000 entries và 50.000 deletions (tombstone), tổng 3 file 3.516.344 byte; đọc khóa đã xóa trả `None`.
- Compaction thủ công: còn 1 file ở level 6 với 50.000 entries, 0 deletions, 697.772 byte; số khóa thực tế 50.000.

**Giới hạn của kết luận.**

- Compaction tự động bị tắt (`set_disable_auto_compactions(True)`) để quan sát từng bước; với cấu hình mặc định, RocksDB tự compaction khi số file ở level 0 đạt ngưỡng.
- Dữ liệu nhỏ (khoảng 10 MB trong memtable) và chạy một lần; không đo hiệu năng hay write amplification.
- `rocksdict` là binding cộng đồng, không phải sản phẩm của nhóm RocksDB; hành vi ghi, flush, compaction là của RocksDB 9.8.4 mà nó gói sẵn.

## Kết quả thật

Nguyên văn output của lần chạy (cũng lưu ở `output.txt`).

```text
# LSM-tree trên RocksDB
Thư viện: rocksdict 0.3.25, rocksdb_version=9.8.4
Python 3.13.16 trên Linux x86_64
Thời điểm chạy: 2026-10-16T07:00:33+00:00
-- Tắt compaction tự động để quan sát từng bước; bước 5 gọi compaction thủ công.

## 1. Ghi 100.000 khóa: dữ liệu nằm trong memtable, chưa có file SST
-- rocksdb.cur-size-all-mem-tables = 10,487,808 byte
-- trước flush: 0 file SST, tổng 0 byte
-- đọc req:000042 → {"id":42,"status":"pending","title":"Yêu cầu số 42"}

## 2. Flush: memtable được ghi thành một file SST ở level 0
-- sau flush lần 1: 1 file SST, tổng 1,583,440 byte
   /000009.sst    level 0  entries 100,000  deletions       0  size 1,583,440

## 3. Ghi đè cả 100.000 khóa rồi flush: bản cũ vẫn nằm trên đĩa
-- sau flush lần 2: 2 file SST, tổng 3,172,124 byte
   /000009.sst    level 0  entries 100,000  deletions       0  size 1,583,440
   /000011.sst    level 0  entries 100,000  deletions       0  size 1,588,684
-- đọc req:000042 → {"id":42,"status":"approved","title":"Yêu cầu số 42"}

## 4. Xóa 50.000 khóa rồi flush: xóa được ghi thành tombstone
-- sau flush lần 3: 3 file SST, tổng 3,516,344 byte
   /000009.sst    level 0  entries 100,000  deletions       0  size 1,583,440
   /000011.sst    level 0  entries 100,000  deletions       0  size 1,588,684
   /000013.sst    level 0  entries  50,000  deletions  50,000  size   344,220
-- đọc req:000042 (đã xóa) → None
-- đọc req:000043 → {"id":43,"status":"approved","title":"Yêu cầu số 43"}

## 5. Compaction: gộp ba file, giữ bản mới nhất, bỏ bản bị ghi đè và khóa đã xóa
-- sau compaction: 1 file SST, tổng 697,772 byte
   /000014.sst    level 6  entries  50,000  deletions       0  size   697,772
-- số khóa thực tế: 50,000
-- đọc req:000043 → {"id":43,"status":"approved","title":"Yêu cầu số 43"}
```
