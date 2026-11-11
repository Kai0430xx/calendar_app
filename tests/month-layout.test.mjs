import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekSegments } from '../src/month-layout.ts';
const dates=['2026-11-22','2026-11-23','2026-11-24','2026-11-25','2026-11-26','2026-11-27','2026-11-28'];
const event=(id,date,endDate=date)=>({id,date,endDate,start:'09:00',end:'',allDay:true});
test('multi-day bar spans every included date in one segment',()=>{
 const [s]=weekSegments([event('trip',dates[1],dates[5])],dates);
 assert.deepEqual([s.start,s.end,s.lane],[1,5,0]);
});
test('ranges crossing week edges clip to visible week',()=>{
 const [s]=weekSegments([event('trip','2026-11-20','2026-12-01')],dates);
 assert.deepEqual([s.start,s.end],[0,6]);
 const next=['2026-11-29','2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04','2026-12-05'];
 const [continued]=weekSegments([s.event],next);
 assert.deepEqual([continued.start,continued.end],[0,2]);
});
test('overlapping bars get separate lanes and later events reuse free lanes',()=>{
 const result=weekSegments([event('a',dates[0],dates[2]),event('b',dates[1],dates[3]),event('c',dates[3],dates[5])],dates);
 assert.deepEqual(result.map(s=>s.lane),[0,1,0]);
});
test('single-day legacy events and adjacent ranges do not overlap',()=>{
 const legacy=event('legacy',dates[2]); delete legacy.endDate;
 const result=weekSegments([legacy,event('later',dates[3])],dates);
 assert.deepEqual(result.map(s=>[s.start,s.end,s.lane]),[[2,2,0],[3,3,0]]);
});
test('events outside visible week are omitted',()=>{
 assert.equal(weekSegments([event('old','2026-11-21'),event('future','2026-11-29')],dates).length,0);
});

test('all-day entries occupy top lanes, timed entries follow start time', () => {
  const result = weekSegments([
    { ...event('late', dates[2]), allDay: false, start: '18:00' },
    { ...event('early', dates[2]), allDay: false, start: '08:00' },
    { ...event('all', dates[2]), start: '23:00' },
  ], dates);
  assert.deepEqual(result.map(s => [s.event.id, s.lane]), [['all', 0], ['early', 1], ['late', 2]]);
});
test('priority-sorted intervals never share a lane on overlapping dates', () => {
  const result = weekSegments([
    event('all-later', dates[4], dates[5]),
    { ...event('timed-long', dates[1], dates[6]), allDay: false },
    { ...event('timed-early', dates[0]), allDay: false },
  ], dates);
  for (let i = 0; i < result.length; i++) for (let j = i + 1; j < result.length; j++) {
    const a = result[i], b = result[j];
    if (a.lane === b.lane) assert.ok(a.end < b.start || b.end < a.start);
  }
  assert.equal(result.find(s=>s.event.id==='all-later').lane, 0);
});
