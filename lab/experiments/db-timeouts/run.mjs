// Timeout ở từng tầng: statement_timeout, lock_timeout, idle_in_transaction_session_timeout, và timeout phía client của driver pg.
import pg from 'pg';
import { header, session, step, note, config, sleep } from '../../lib/harness.mjs';

await header('Timeout và hủy truy vấn trên PostgreSQL');
const A = await session('A');
const B = await session('B');

await A.q(`drop schema if exists exp_to cascade`, undefined, { quiet: true });
await A.q(`create schema exp_to`, undefined, { quiet: true });
await A.q(`create table exp_to.t (id int primary key, v int not null)`, undefined, { quiet: true });
await A.q(`insert into exp_to.t values (1, 0)`, undefined, { quiet: true });

step('1. statement_timeout hủy câu lệnh, kết nối vẫn dùng được');
await A.q(`show statement_timeout`);
await A.q(`set statement_timeout = '300ms'`);
await A.q(`select pg_sleep(2)`);
await A.q(`select 1 as van_dung_duoc`);
await A.q(`reset statement_timeout`);

step('2. Trong transaction, câu lệnh bị hủy làm hỏng cả transaction');
await A.q(`begin`);
await A.q(`update exp_to.t set v = 1 where id = 1`);
await A.q(`set local statement_timeout = '300ms'`);
await A.q(`select pg_sleep(2)`);
await A.q(`select 1 as cau_tiep_theo`);
await A.q(`rollback`);
await B.q(`select v from exp_to.t where id = 1`);

step('3. lock_timeout chỉ giới hạn thời gian chờ khóa');
await A.q(`begin`);
await A.q(`update exp_to.t set v = 2 where id = 1`);
await B.q(`set lock_timeout = '300ms'`);
await B.q(`update exp_to.t set v = 3 where id = 1`);
await B.q(`reset lock_timeout`);
await A.q(`rollback`);

step('4. idle_in_transaction_session_timeout kết thúc cả phiên');
const C = await session('C');
C.client.on('error', (e) => console.log(`[C] sự kiện error của client: ${e.code ?? ''} ${e.message}`));
await C.q(`set idle_in_transaction_session_timeout = '300ms'`);
await C.q(`begin`);
await C.q(`update exp_to.t set v = 4 where id = 1`);
note('C nghỉ 800 ms trong transaction đang mở.');
await sleep(800);
await B.q(`select v from exp_to.t where id = 1`);
await B.q(`select count(*) as so_phien_C from pg_stat_activity where application_name = 'lab-C'`);
await C.q(`select 1 as sau_khi_bi_ket_thuc`);

step('5. statement_timeout đặt qua cấu hình của driver');
const D = await session('D', { statement_timeout: 300 });
await D.q(`show statement_timeout`);
await D.q(`select pg_sleep(2)`);
await D.end();

step('6. query_timeout của driver: client bỏ cuộc, server vẫn chạy');
const E = new pg.Client({ ...config, application_name: 'lab-E', query_timeout: 300 });
E.on('error', (e) => console.log(`[E] sự kiện error của client: ${e.message}`));
await E.connect();
const pidE = E.processID;
const t0 = Date.now();
const kq = await E.query(`select pg_sleep(3)`).then(() => 'xong', (e) => `lỗi: ${e.message}`);
console.log(`[E] client nhận kết quả sau ${Date.now() - t0 >= 300 && Date.now() - t0 < 1000 ? 'khoảng 300 ms' : Date.now() - t0 + ' ms'}: ${kq}`);
await B.q(`select state, left(query, 30) as cau_lenh from pg_stat_activity where pid = ${pidE}`);
note('Server vẫn đang chạy câu lệnh dù client đã báo lỗi. Hủy từ phiên khác bằng pg_cancel_backend.');
await B.q(`select pg_cancel_backend(${pidE}) as da_gui_tin_hieu`);
await sleep(200);
await B.q(`select state, left(query, 30) as cau_lenh from pg_stat_activity where pid = ${pidE}`);
await E.end().catch(() => {});

await A.q(`drop schema exp_to cascade`, undefined, { quiet: true });
await A.end();
await B.end();
await C.end().catch(() => {});
