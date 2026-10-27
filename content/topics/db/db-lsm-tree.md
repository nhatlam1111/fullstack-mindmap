---
id: db-lsm-tree
title: LSM-tree
parent: db-storage
summary: Cấu trúc tối ưu cho ghi nhiều, đánh đổi bằng compaction và đọc.
contentStatus: draft
volatility: stable
prerequisites:
  - db-btree
related:
  - db-wide-column
  - db-index-basics
sources:
  - id: oneil-lsm
    url: https://www.cs.umb.edu/~poneil/lsmtree.pdf
    title: "O'Neil, Cheng, Gawlick, O'Neil — The Log-Structured Merge-Tree (LSM-Tree), bản tác giả gửi Acta Informatica"
    supports: "Cấu trúc index trên đĩa chuẩn như B-tree sẽ làm chi phí I/O của giao dịch tăng gần gấp đôi khi phải duy trì index theo thời gian thực trong tình huống bài báo xét; LSM-tree dùng thuật toán trì hoãn và gom các thay đổi của index, đẩy dần từ thành phần trong bộ nhớ xuống các thành phần trên đĩa; các lượt tìm cần trả lời ngay sẽ mất hiệu quả I/O trong một số trường hợp, nên LSM-tree có ích nhất khi chèn vào index phổ biến hơn tìm."
    product: LSM-tree (bài báo gốc)
    version: bản tiền in của tác giả
    checkedAt: 2026-10-16
  - id: rocksdb-overview
    url: https://github.com/facebook/rocksdb/wiki/RocksDB-Overview
    title: "RocksDB Wiki — RocksDB Overview"
    supports: "Ba thành phần cơ bản của RocksDB là memtable, sstfile và logfile; logfile là Write Ahead Log ghi tuần tự; mọi thao tác ghi (Put, Delete, Merge) được lưu vào bộ đệm trong bộ nhớ gọi là memtable; memtable đầy thì thành immutable memtable và một luồng nền flush nội dung ra storage, vào một file ở Level-0, và logfile tương ứng có thể xóa an toàn; dữ liệu mới hơn ở L0, dữ liệu cũ hơn ở các level số lớn hơn tới Lmax; compaction loại bỏ các cặp khóa-giá trị đã bị xóa hoặc ghi đè và tổ chức lại dữ liệu cho truy vấn hiệu quả; Level style mặc định tối ưu space amplification; Universal style thường có write amplification thấp hơn nhưng space và read amplification cao hơn."
    product: RocksDB
    version: "wiki, không gắn phiên bản (lab dùng 9.8.4)"
    checkedAt: 2026-10-16
  - id: rocksdb-leveled
    url: https://github.com/facebook/rocksdb/wiki/Leveled-Compaction
    title: "RocksDB Wiki — Leveled Compaction"
    supports: "Các file ở L0 thường chồng lấn khoảng khóa nên compaction L0 thường phải lấy mọi file L0; mỗi level trừ level 0 là một sorted run, dữ liệu chia theo khoảng vào nhiều file SST; compaction kích hoạt khi số file L0 đạt level0_file_num_compaction_trigger; tìm một khóa trong một level: tìm nhị phân trên khóa đầu và cuối của các file để biết file nào có thể chứa khóa, tổng thể là tìm nhị phân trên toàn level; level_compaction_dynamic_level_bytes mặc định là true từ bản 8.4, kích thước mục tiêu của level cuối (num_levels-1) bằng kích thước thực của level lớn nhất, để giữ cấu trúc ổn định với khoảng 90% dữ liệu ở level cuối."
    product: RocksDB
    version: "wiki, không gắn phiên bản (lab dùng 9.8.4)"
    checkedAt: 2026-10-16
  - id: rocksdb-compaction
    url: https://github.com/facebook/rocksdb/wiki/Compaction
    title: "RocksDB Wiki — Compaction"
    supports: "Leveled compaction cổ điển giảm tối thiểu space amplification với cái giá là read và write amplification; tiered compaction giảm tối thiểu write amplification với cái giá là read và space amplification; FIFO compaction bỏ file cũ nhất khi hết hạn, dùng cho dữ liệu kiểu cache."
    product: RocksDB
    version: "wiki, không gắn phiên bản (lab dùng 9.8.4)"
    checkedAt: 2026-10-16
  - id: rocksdb-bloom
    url: https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter
    title: "RocksDB Wiki — RocksDB Bloom Filter"
    supports: "Bloom filter là mảng bit cho biết một khóa có thể có hoặc chắc chắn không có trong một tập khóa; mỗi file SST mới tạo chứa một Bloom filter; nó giảm I/O, CPU và việc thay đổi block cache cho DB::Get; whole key bloom chỉ dùng cho tra cứu một khóa; mặc định khoảng 10 bit mỗi khóa, phần lớn nằm trong bộ nhớ và trên đĩa."
    product: RocksDB
    version: "wiki, không gắn phiên bản (lab dùng 9.8.4)"
    checkedAt: 2026-10-16
  - id: myrocks-pvldb
    url: https://www.vldb.org/pvldb/vol13/p3217-matsunobu.pdf
    title: "Matsunobu, Dong, Lee (Facebook) — MyRocks: LSM-Tree Database Storage Engine Serving Facebook's Social Graph, PVLDB 13(12), 2020"
    supports: "Facebook dùng InnoDB (storage engine dựa trên B+Tree) và thấy cấu trúc B-tree lãng phí chỗ do phân mảnh index, write amplification cao hơn và thỉnh thoảng nghẽn khi ghi xuống flash; nhóm chọn LSM-tree thay B-tree để tiết kiệm chỗ với cái giá là hiệu năng đọc; MyRocks giảm kích thước instance 62,3% cho tập dữ liệu UDB, ít thao tác I/O hơn và ít CPU hơn InnoDB khi phục vụ cùng tải production; lượng byte ghi xuống flash giảm 75%; xóa được xử lý bằng cách thêm marker, tombstone vẫn còn vì có thể có Put cho cùng khóa ở file SST level thấp hơn, compaction bỏ tombstone khi chúng tới Lmax; nhiều tombstone làm quét theo khoảng chậm đi đáng kể vì phải quét qua mọi tombstone, nhóm thêm kiểu xóa SingleDelete; quét theo khoảng phải tìm nhị phân trong từng sorted run rồi gộp bằng heap, LSM-tree có chi phí seek cao hơn nhiều; duyệt ngược chậm hơn nhiều so với duyệt xuôi; compaction, nhất là khi do ghi dồn dập, có thể gây nghẽn; Bloom filter lưu trong mỗi file SST để bỏ qua việc tìm không cần thiết, hiệu năng LSM-tree cần cache Bloom filter trong bộ nhớ."
    product: MyRocks (MySQL + RocksDB) tại Facebook
    version: PVLDB 13(12), 2020
    checkedAt: 2026-10-16
examples:
  - id: lab-lsm
    kind: lab-run
    title: "Ghi, ghi đè, xóa và compaction trên RocksDB 9.8.4: memtable, file SST ở L0, tombstone"
    path: lab/experiments/db-lsm-tree
    checkedAt: 2026-10-16
  - id: myrocks-facebook
    kind: research
    title: "Facebook chuyển cơ sở dữ liệu đồ thị xã hội từ InnoDB (B+Tree) sang MyRocks (LSM-tree), PVLDB 2020"
    url: https://www.vldb.org/pvldb/vol13/p3217-matsunobu.pdf
    checkedAt: 2026-10-16
changelog:
  - date: 2026-10-16
    note: "Claude soạn bài từ bài báo LSM-tree gốc, wiki RocksDB, bài báo MyRocks (PVLDB 2020) và chạy thử nghiệm trên RocksDB 9.8.4."
---

## Vấn đề cần giải quyết

B-tree đưa mỗi khóa mới vào đúng trang lá của nó trên đĩa, tách trang khi trang đầy (bài B-tree). Khi ứng dụng chèn liên tục với tốc độ cao, việc này tốn kém. Bài báo gốc về LSM-tree của O'Neil và cộng sự chỉ ra rằng trong tình huống họ xét, duy trì một index trên đĩa như B-tree theo thời gian thực làm chi phí I/O của giao dịch tăng gần gấp đôi[^oneil-lsm].

LSM-tree (Log-Structured Merge-Tree) giải quyết bằng cách không ghi ngay vào cấu trúc trên đĩa: nó trì hoãn và gom các thay đổi lại, rồi đẩy dần từ thành phần trong bộ nhớ xuống các thành phần trên đĩa[^oneil-lsm].

## Cơ chế và luồng hoạt động

Phần dưới mô tả theo RocksDB, một storage engine LSM-tree, và lab chạy RocksDB 9.8.4.

**Ba thành phần.** RocksDB có memtable, sstfile và logfile. Logfile là Write Ahead Log, ghi tuần tự[^rocksdb-overview].

**Ghi vào bộ nhớ trước.** Mọi thao tác ghi (`Put`, `Delete`, `Merge`) được lưu vào một bộ đệm trong bộ nhớ gọi là memtable[^rocksdb-overview]. Lab bước 1: ghi 100.000 khóa xong vẫn chưa có file SST nào, memtable chiếm 10.487.808 byte, và đọc khóa vẫn có kết quả.

**Flush ra file SST ở level 0.** Memtable đầy thì thành immutable memtable, và một luồng nền ghi nội dung của nó ra một file ở Level-0 (L0); logfile tương ứng sau đó có thể xóa an toàn[^rocksdb-overview]. Lab bước 2 gọi flush thủ công: có 1 file SST ở L0 với 100.000 entry, 1.583.440 byte.

**Ghi đè không sửa file cũ.** Dữ liệu mới hơn nằm ở L0, dữ liệu cũ hơn nằm ở các level số lớn hơn[^rocksdb-overview]. Lab bước 3 ghi đè cả 100.000 khóa rồi flush: có 2 file ở L0, mỗi file 100.000 entry. Bản cũ vẫn nằm nguyên trong file thứ nhất, nhưng đọc khóa `req:000042` trả về giá trị mới (`approved`).

**Xóa là ghi thêm một marker.** Trong LSM-tree, xóa được xử lý bằng cách thêm marker, gọi là tombstone. Tombstone phải ở lại vì có thể còn bản `Put` của cùng khóa trong file SST ở level thấp hơn[^myrocks-pvldb]. Lab bước 4 xóa 50.000 khóa rồi flush: file thứ ba có 50.000 entry, cả 50.000 đều là deletion. Tổng dung lượng tăng từ 3.172.124 lên 3.516.344 byte dù vừa xóa một nửa số khóa; đọc khóa đã xóa trả `None`.

**Compaction dọn dẹp.** Compaction loại bỏ các cặp khóa-giá trị đã bị xóa hoặc bị ghi đè và tổ chức lại dữ liệu để truy vấn hiệu quả[^rocksdb-overview]. RocksDB bỏ tombstone trong compaction khi chúng tới level cuối[^myrocks-pvldb]. Lab bước 5 gọi compaction thủ công: ba file gộp thành một file với 50.000 entry, 0 deletion, 697.772 byte. Lab ghi nhận file này nằm ở level 6 chứ không phải level 1. Tài liệu RocksDB cho biết từ bản 8.4, tùy chọn `level_compaction_dynamic_level_bytes` mặc định bật, nhằm giữ cấu trúc ổn định với khoảng 90% dữ liệu ở level cuối[^rocksdb-leveled]; bài này không đi sâu vào cách RocksDB chọn level đích.

**Các level.** Với leveled compaction của RocksDB, các file ở L0 thường chồng lấn khoảng khóa. Mỗi level còn lại là một sorted run, chia theo khoảng khóa vào nhiều file SST. Compaction tự động bắt đầu khi số file ở L0 đạt `level0_file_num_compaction_trigger`[^rocksdb-leveled]. Trong một level, tìm một khóa là tìm nhị phân trên khoảng khóa của các file để biết file nào có thể chứa nó[^rocksdb-leveled].

**Đọc cần thêm trợ giúp.** Một khóa có thể có bản ở nhiều file (lab bước 3). RocksDB gắn Bloom filter vào mỗi file SST mới. Bloom filter cho biết một khóa có thể có, hoặc chắc chắn không có, trong file; nhờ vậy giảm I/O và CPU khi đọc một khóa (`DB::Get`). Bloom filter theo nguyên khóa chỉ dùng cho tra cứu một khóa, và mặc định tốn khoảng 10 bit mỗi khóa[^rocksdb-bloom]. Quét theo khoảng thì phải tìm nhị phân trong từng sorted run rồi gộp kết quả bằng heap[^myrocks-pvldb].

**Các kiểu compaction.** Trên RocksDB, leveled compaction giảm tối thiểu space amplification (dung lượng thực so với dữ liệu logic), đổi lại read và write amplification cao hơn. Tiered compaction (Universal) giảm tối thiểu write amplification, đổi lại read và space amplification cao hơn. FIFO compaction bỏ file cũ nhất khi hết hạn, dùng cho dữ liệu kiểu cache[^rocksdb-compaction][^rocksdb-overview].

## Điều kiện áp dụng, lợi ích và đánh đổi

- **Hợp khi ghi nhiều hơn đọc.** Theo bài báo gốc, LSM-tree có ích nhất khi chèn vào index phổ biến hơn tìm; các lượt tìm cần trả lời ngay sẽ mất hiệu quả I/O trong một số trường hợp[^oneil-lsm].
- **Lợi về dung lượng và lượng ghi.** Facebook chọn LSM-tree (MyRocks) thay B-tree (InnoDB) để tiết kiệm chỗ, chấp nhận đọc chậm hơn. Kết quả họ công bố: kích thước instance giảm 62,3% với tập dữ liệu UDB, byte ghi xuống flash giảm 75%[^myrocks-pvldb].
- **Đọc theo khoảng tốn hơn.** LSM-tree có chi phí seek cao hơn nhiều so với B-tree, và trên RocksDB duyệt ngược chậm hơn nhiều so với duyệt xuôi[^myrocks-pvldb].
- **Xóa không giải phóng chỗ ngay.** Tombstone chiếm chỗ tới khi compaction bỏ đi[^myrocks-pvldb]; lab: xóa một nửa số khóa mà dung lượng tăng thêm 344.220 byte.
- **Compaction tốn tài nguyên nền.** Compaction, nhất là khi do ghi dồn dập, có thể gây nghẽn[^myrocks-pvldb]. Chọn kiểu compaction là chọn giữa read, write và space amplification[^rocksdb-compaction].
- **Cần bộ nhớ cho Bloom filter.** Hiệu năng LSM-tree cần Bloom filter được cache trong bộ nhớ[^myrocks-pvldb].

## Lỗi thường gặp và dấu hiệu nhận biết

- **Nghĩ rằng xóa sẽ giảm dung lượng ngay.** Dấu hiệu: dung lượng đĩa không giảm, thậm chí tăng, sau khi xóa hàng loạt (lab bước 4), và chỉ giảm sau compaction (lab bước 5).
- **Xóa nhiều rồi quét theo khoảng qua vùng vừa xóa.** Nhiều tombstone làm quét theo khoảng chậm đi đáng kể vì phải quét qua mọi tombstone[^myrocks-pvldb]. Dấu hiệu: truy vấn khoảng chậm hẳn sau đợt xóa lớn. Facebook thêm kiểu xóa `SingleDelete` để giảm vấn đề này[^myrocks-pvldb].
- **Ghi dồn dập không kiểm soát.** Dấu hiệu: độ trễ ghi tăng vọt theo đợt; với MyRocks, ghi dồn dập là một trong những nguyên nhân gây nghẽn phổ biến nhất[^myrocks-pvldb].
- **Dùng `ORDER BY ... DESC` như trên B-tree.** Trên MyRocks, truy vấn `ORDER BY` theo chiều cần duyệt ngược chậm hơn nhiều so với chiều xuôi[^myrocks-pvldb]. Dấu hiệu: cùng truy vấn nhưng đảo chiều sắp xếp thì chậm hẳn.
- **Chọn LSM-tree cho tải chủ yếu đọc cần trả lời ngay.** Dấu hiệu: đọc chậm hơn engine B-tree trong khi lượng ghi không đáng kể[^oneil-lsm].

## Ví dụ thực tế

[ex:lab-lsm] — RocksDB 9.8.4 qua thư viện Python `rocksdict` 0.3.25, tắt compaction tự động để quan sát từng bước:

| Bước | File SST | Tổng dung lượng | Đọc `req:000042` |
|---|---|---|---|
| Ghi 100.000 khóa | 0 (dữ liệu ở memtable) | 0 byte | `pending` |
| Flush | 1 ở L0 | 1.583.440 byte | |
| Ghi đè 100.000 khóa, flush | 2 ở L0 | 3.172.124 byte | `approved` |
| Xóa 50.000 khóa, flush | 3 ở L0 | 3.516.344 byte | `None` |
| Compaction | 1 ở L6, 50.000 entry, 0 deletion | 697.772 byte | |

[ex:myrocks-facebook] — Facebook dùng InnoDB, một storage engine B+Tree, cho cơ sở dữ liệu đồ thị xã hội (UDB). Nhóm thấy B-tree lãng phí chỗ do phân mảnh index và có write amplification cao hơn, nên xây MyRocks trên RocksDB. Bài báo PVLDB 2020 của họ ghi nhận kích thước instance giảm 62,3% với tập dữ liệu UDB, byte ghi xuống flash giảm 75%, và ít CPU hơn khi phục vụ cùng tải production; đồng thời liệt kê các điểm yếu như quét theo khoảng, duyệt ngược, tombstone và nghẽn do compaction[^myrocks-pvldb].

## Câu hỏi tự kiểm tra

- Trong lab, sau khi ghi đè 100.000 khóa, bản cũ nằm ở đâu, và vì sao đọc vẫn ra giá trị mới?
- Vì sao xóa 50.000 khóa lại làm dung lượng tăng? Khi nào dung lượng giảm?
- Bloom filter trả lời câu hỏi gì, và vì sao nó không giúp được quét theo khoảng?
- Leveled compaction và tiered compaction đánh đổi gì với nhau?
- Facebook được gì và mất gì khi chuyển từ InnoDB sang MyRocks?

## Chủ đề liên quan và nguồn kiểm chứng
