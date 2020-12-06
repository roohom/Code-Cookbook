# Hive SQL50题记录



1.

~~~mysql
select * 
from
(select n.sid 
from 
(select 
  a.s_id as sid,
  a.c_id as cid,
  a.s_score as s,
  lead(a.s_score,1,0) over (partition by a.s_id order by a.c_id) as  p
from score a) as n
where n.s>n.p and n.cid=01) as m join student q 
on m.sid=q.s_id;
~~~



2.

~~~mysql
select q.* from
(select n.sid from 
(select 
  a.s_id as sid,
  a.c_id as cid,
  a.s_score as s,
  lead(a.s_score,1,0) over (partition by a.s_id order by a.c_id) as  p
from score a) as n
where n.s<n.p and n.cid=01) as m join student q on m.sid=q.s_id;
~~~

3

~~~mysql
select * 
from 
(select  
  b.s_id,  
  b.s_name,  
  p.avg  
from ( 
select  
  s.s_id ,  
  round(avg(s.s_score),2) as `avg`  
  from score s  
  group by s.s_id  ) p right join student b on p.s_id = b.s_id) as n
  where n.avg>=60;
~~~

