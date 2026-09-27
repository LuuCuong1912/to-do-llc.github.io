import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { newUser, getPackages, buyPlan, cleanup, pool } from './helpers.js';

let pk;
beforeAll(async () => {
  pk = await getPackages();
});
afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('Todo theo gói (MySQL thật)', () => {
  it('chưa mua gói → 403 SUBSCRIPTION_REQUIRED', async () => {
    const { agent } = await newUser('nosub');
    expect((await agent.get('/api/todos')).body.error.code).toBe('SUBSCRIPTION_REQUIRED');
  });

  it('Gold: thêm (trim, giữ nguyên văn), sửa, xong rồi không sửa được, xóa; người khác không xóa được', async () => {
    const { agent } = await newUser('gold');
    await buyPlan(agent, pk.gold.id);
    const todo = (await agent.post('/api/todos').send({ text: '  Học <b>Express</b> 😀  ' })).body.data.todo;
    expect(todo.text).toBe('Học <b>Express</b> 😀');
    expect((await agent.patch(`/api/todos/${todo.id}`).send({ text: 'Sửa' })).body.data.todo.text).toBe('Sửa');
    await agent.patch(`/api/todos/${todo.id}`).send({ completed: true });
    expect((await agent.patch(`/api/todos/${todo.id}`).send({ text: 'x' })).body.error.code).toBe('TODO_COMPLETED');

    const other = await newUser('thief');
    await buyPlan(other.agent, pk.basic.id);
    expect((await other.agent.delete(`/api/todos/${todo.id}`)).status).toBe(404);
    expect((await agent.delete(`/api/todos/${todo.id}`)).status).toBe(200);
  });

  it('Basic: sửa nội dung → 403; 18 việc + 5 request cùng lúc → chỉ thêm được 2 (tổng 20)', async () => {
    const { agent, id } = await newUser('basic');
    await buyPlan(agent, pk.basic.id);
    const first = (await agent.post('/api/todos').send({ text: 'việc 1' })).body.data.todo;
    expect((await agent.patch(`/api/todos/${first.id}`).send({ text: 'x' })).body.error.code).toBe(
      'FEATURE_NOT_AVAILABLE',
    );

    await pool.query(
      'INSERT INTO todos (user_id, text) VALUES ' + Array(17).fill('(?, "x")').join(', '),
      Array(17).fill(id),
    );
    const burst = await Promise.all(
      [1, 2, 3, 4, 5].map((i) => agent.post('/api/todos').send({ text: `cùng lúc ${i}` })),
    );
    expect(burst.filter((r) => r.status === 201)).toHaveLength(2);
    expect((await agent.get('/api/todos')).body.data.todos).toHaveLength(20);
  });

  it('Pro "không giới hạn": trần an toàn 1.000 việc', async () => {
    const { agent, id } = await newUser('pro');
    await buyPlan(agent, pk.pro.id);
    await pool.query(
      `INSERT INTO todos (user_id, text)
       SELECT ?, CONCAT('Việc ', n) FROM (WITH RECURSIVE s(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM s WHERE n < 999) SELECT n FROM s) t`,
      [id],
    );
    expect((await agent.post('/api/todos').send({ text: 'thứ 1000' })).status).toBe(201);
    expect((await agent.post('/api/todos').send({ text: 'thứ 1001' })).body.error.code).toBe('TASK_LIMIT_REACHED');
    expect((await agent.get('/api/todos')).body.data.todos).toHaveLength(1000);
  });
});
