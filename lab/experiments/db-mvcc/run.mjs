// MVCC trên PostgreSQL: update tạo phiên bản dòng mới, dòng cũ chờ VACUUM; transaction mở lâu giữ dòng cũ lại.
import { header, session, step, note, sleep } from '../../lib/harness.mjs';

await header('MVCC và VACUUM trên PostgreSQL');
const A = await session('A');
const B = await session('B');
await A.q('drop schema if exists exp_mvcc cascade');
await A.q('create schema exp_mvcc');
await A.q('create extension if not exists pgstattuple');
await A.q(`create table exp_mvcc.requests (id integer primary key, status text not null) with (autovacuum_enabled = off)`);
await A.q(`insert into exp_mvcc.requests select g, 'pending' from generate_series(1, 1000) g`);
await A.q('set search_path = exp_mvcc, public');
await B.q('set search_path = exp_mvcc, public');
note('Tắt autovacuum cho bảng thử nghiệm để quan sát từng bước bằng VACUUM chạy tay.');

step('1. Mỗi dòng mang xmin: id transaction đã tạo ra phiên bản này');
await A.q(`select ctid, xmin, xmax, id, status from requests where id = 1`);
await A.q(`update requests set status = 'approved' where id = 1`);
await A.q(`select ctid, xmin, xmax, id, status from requests where id = 1`);
note('Sau update, dòng nằm ở vị trí vật lý mới (ctid khác) với xmin mới: đây là phiên bản mới, không phải sửa tại chỗ.');

step('2. Update toàn bảng để lại 1.000 phiên bản cũ (dead tuple)');
await A.q(`update requests set status = 'approved'`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);

step('3. VACUUM dọn phiên bản cũ khi không còn transaction nào cần thấy chúng');
await A.q(`vacuum (verbose, process_toast false) requests`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);

step('4. Một transaction Repeatable Read đang mở giữ snapshot cũ');
await B.q('begin isolation level repeatable read');
await B.q(`select count(*) filter (where status = 'approved') as approved from requests`);
const M = await session('monitor');
await M.q(`select application_name, state, backend_xid, backend_xmin from pg_stat_activity where application_name = 'lab-B'`);
note('B chỉ đọc nên chưa có backend_xid, nhưng giữ snapshot của transaction: backend_xmin khác NULL.');
await A.q(`update requests set status = 'rejected'`);
await A.q(`vacuum (verbose, process_toast false) requests`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);
note('VACUUM không xóa được 1.000 phiên bản cũ vì B có thể vẫn cần đọc chúng.');
await B.q(`select count(*) filter (where status = 'approved') as approved from requests`);
await B.q('commit');
await sleep(200);
await A.q(`vacuum (verbose, process_toast false) requests`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);

step('4b. Transaction Read Committed đang mở, chỉ chạy SELECT, đang nghỉ giữa hai câu lệnh');
await A.q(`create table other_table (x integer)`);
await B.q('begin isolation level read committed');
await B.q(`select count(*) from requests`);
await M.q(`select application_name, state, backend_xid, backend_xmin from pg_stat_activity where application_name = 'lab-B'`);
await A.q(`update requests set status = 'cancelled'`);
await A.q(`vacuum (verbose, process_toast false) requests`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);
note('B vẫn mở transaction nhưng không giữ snapshot giữa hai câu lệnh, nên VACUUM dọn được.');
await B.q('commit');

step('4c. Transaction Read Committed đang mở đã ghi (đã có transaction ID), đang nghỉ');
await B.q('begin isolation level read committed');
await B.q(`insert into other_table values (1)`);
await M.q(`select application_name, state, backend_xid, backend_xmin from pg_stat_activity where application_name = 'lab-B'`);
await A.q(`update requests set status = 'pending'`);
await A.q(`vacuum (verbose, process_toast false) requests`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);
await B.q('commit');
await sleep(200);
await A.q(`vacuum (verbose, process_toast false) requests`);
await A.q(`select tuple_count, dead_tuple_count from pgstattuple('exp_mvcc.requests')`);
await M.end();

step('5. Tuổi transaction ID của database (khoảng cách tới giới hạn wraparound)');
await A.q(`select datname, age(datfrozenxid) as tuoi_xid, current_setting('autovacuum_freeze_max_age') as autovacuum_freeze_max_age from pg_database where datname = current_database()`);
await A.end();
await B.end();
