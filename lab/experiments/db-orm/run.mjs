// ORM: dùng TypeORM trên PostgreSQL và in mọi câu SQL nó sinh ra cho từng thao tác.
import { DataSource, EntitySchema } from 'typeorm';
import { readFileSync } from 'node:fs';
import { header, session, step, config } from '../../lib/harness.mjs';

await header('ORM (TypeORM) trên PostgreSQL');
console.log(`TypeORM: ${JSON.parse(readFileSync(new URL('../../node_modules/typeorm/package.json', import.meta.url))).version}`);

const A = await session('A');
for (const sql of [
  `drop schema if exists exp_orm cascade`,
  `create schema exp_orm`,
  `create table exp_orm.users (id int primary key, name text not null)`,
  `create table exp_orm.requests (id int primary key, title text not null, status text not null, requester_id int not null references exp_orm.users)`,
  `insert into exp_orm.users select g, 'Người ' || g from generate_series(1, 5) g`,
  `insert into exp_orm.requests select g, 'Yêu cầu ' || g, 'pending', 1 + g % 5 from generate_series(1, 5) g`,
  `create table exp_orm.counters (id int primary key, a int8 not null, b int8 not null)`,
  `insert into exp_orm.counters values (1, 9007199254740993, 9007199254740993)`,
]) await A.q(sql, undefined, { quiet: true });

const User = new EntitySchema({
  name: 'User', tableName: 'users', schema: 'exp_orm',
  columns: { id: { type: Number, primary: true }, name: { type: String } },
});
const Request = new EntitySchema({
  name: 'Request', tableName: 'requests', schema: 'exp_orm',
  columns: { id: { type: Number, primary: true }, title: { type: String }, status: { type: String } },
  relations: { requester: { type: 'many-to-one', target: 'User', joinColumn: { name: 'requester_id' } } },
});

const Counter = new EntitySchema({
  name: 'Counter', tableName: 'counters', schema: 'exp_orm',
  columns: { id: { type: Number, primary: true }, a: { type: Number }, b: { type: 'bigint' } },
});

let sqlCount = 0;
const logger = {
  logQuery: (q, p) => { sqlCount += 1; console.log(`   SQL ${sqlCount}: ${q.replace(/\s+/g, ' ')}${p?.length ? `  -- tham số: ${JSON.stringify(p)}` : ''}`); },
  logQueryError: (e, q) => console.log(`   LỖI: ${e} ở ${q}`),
  logQuerySlow: () => {}, logSchemaBuild: () => {}, logMigration: () => {}, log: () => {},
};
const db = new DataSource({
  type: 'postgres', host: config.host, port: config.port, username: config.user, password: config.password, database: config.database,
  entities: [User, Request, Counter], synchronize: false, logging: true, logger,
});
await db.initialize();
const requests = db.getRepository('Request');
const users = db.getRepository('User');
const begin = (t) => { step(t); sqlCount = 0; };

begin('1. find theo khóa chính');
console.log(`   kết quả: ${JSON.stringify(await requests.findOneBy({ id: 1 }))}`);

begin('2. Không khai báo relations thì quan hệ không được nạp');
const r2 = await requests.findOneBy({ id: 1 });
console.log(`   r.requester = ${r2.requester}`);

begin('3. Lặp qua danh sách rồi nạp người gửi từng dòng: N+1 câu SQL');
for (const r of await requests.find({ order: { id: 'ASC' } })) {
  const full = await requests.findOne({ where: { id: r.id }, relations: { requester: true } });
  void full;
}
console.log(`   tổng số câu SQL: ${sqlCount}`);

begin('4. Khai báo relations trên truy vấn danh sách: một câu có JOIN');
const list = await requests.find({ relations: { requester: true }, order: { id: 'ASC' } });
console.log(`   số dòng: ${list.length}, người gửi dòng đầu: ${list[0].requester.name}; tổng số câu SQL: ${sqlCount}`);

begin('5. relationLoadStrategy = query: tách thành nhiều câu');
await requests.find({ relations: { requester: true }, relationLoadStrategy: 'query', order: { id: 'ASC' } });
console.log(`   tổng số câu SQL: ${sqlCount}`);

begin('6. save() trên entity đã nạp, đổi một cột');
const r6 = await requests.findOneBy({ id: 2 });
sqlCount = 0;
r6.status = 'approved';
await requests.save(r6);
console.log(`   tổng số câu SQL của save(): ${sqlCount}`);

begin('7. save() khi không có gì đổi');
const r7 = await requests.findOneBy({ id: 2 });
sqlCount = 0;
await requests.save(r7);
console.log(`   tổng số câu SQL của save(): ${sqlCount}`);

begin('8. update(): một câu UPDATE, không nạp entity');
await requests.update({ id: 3 }, { status: 'approved' });
console.log(`   tổng số câu SQL: ${sqlCount}`);

begin('9. QueryBuilder chỉ lấy cột cần và đếm theo nhóm');
const g = await requests.createQueryBuilder('r').select('r.status', 'status').addSelect('count(*)', 'so_dong').groupBy('r.status').orderBy('r.status').getRawMany();
console.log(`   kết quả: ${JSON.stringify(g)}`);

begin('10. Câu SQL viết tay qua ORM vẫn truyền tham số riêng');
console.log(`   kết quả: ${JSON.stringify(await db.query('select name from exp_orm.users where id = $1', [1]))}`);

begin('11. save() một mảng entity');
const r11 = await requests.find({ order: { id: 'ASC' } });
sqlCount = 0;
for (const r of r11) r.status = 'rejected';
await requests.save(r11);
console.log(`   tổng số câu SQL của save(mảng 5 entity): ${sqlCount}`);

begin('12. Đếm qua repository và QueryBuilder');
const c1 = await requests.count();
const c2 = await requests.createQueryBuilder('r').getCount();
console.log(`   count(): typeof = ${typeof c1}, giá trị = ${c1}; getCount(): typeof = ${typeof c2}, giá trị = ${c2}`);

begin('13. Cột int8 khai báo khác nhau trong entity');
const c = await db.getRepository('Counter').findOneBy({ id: 1 });
console.log(`   cột a (type: Number): typeof = ${typeof c.a}, giá trị = ${c.a}`);
console.log(`   cột b (type: 'bigint'): typeof = ${typeof c.b}, giá trị = ${c.b}`);

await db.destroy();
await A.q(`drop schema exp_orm cascade`, undefined, { quiet: true });
await A.end();
void users;
