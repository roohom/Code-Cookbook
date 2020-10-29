# MySQL 50题记录

[点我去原文](https://blog.csdn.net/fashion2014/article/details/78826299)

[TOC]

### 整理在前:

- 关于MySQL日期查询
  - 46~50题
    - 46，查询年龄，对year操作
    - 47，48，查询本周，对week操作
    - 49，50，查询月份，对month操作
- 模糊匹配
  - 29,31
- 可以使用union all（union）
  - 22,23,25,42
- 取前几名，却没有严格排序
  - 可以联合两张表a表和b表，取b表中比a表中大的指定个数行
- 严格要求排名
  - 19,20,24

### 可能涉及的到的知识:

#### IF表达式

- 在MySQL中if()函数的用法类似于java中的三目表达式，其用处也比较多，具体语法如下：
  `IF(expr1,expr2,expr3)`，如果expr1的值为true，则返回expr2的值，如果expr1的值为false，则返回expr3的值。

#### 用户变量

- MySQL用户变量：基于会话变量实现的，可以暂存值，并传递给同一连接里的下一条SQL使用的变量，当客户端连接退出时，变量会被释放。

  MySQL用户变量应用场景：**同一连接，未关闭情况下，帮你暂存一些计算结果。**

  （<font color="red">跳坑警告</font>！在做实现rank排序之类的操作时，注意`@var=num` 和`@var := num`的区别！）

  - 展开说说:

    - 例如第20题要对所有学生的总成绩进行排名，正确写法应该是这样的：

      ~~~MySQL
      select s.s_id,
             sum(s.s_score) as total,
             @i := @i + 1   as rk
      from score as s,
           (select @i := 0) as t
      group by s.s_id
      order by total desc;
      ~~~

    - 可是如果你加班眼花或者手抖少写了`select @i := 0`中的那个`：`，那么你每次执行一次，你得到的排名名次(即rk列)都会发生变化，都是在你前一次执行的基础上进行变化，我们来做一次测试

      测试SQL代码①:

      ~~~MySQL
      select s.s_id,
             sum(s.s_score) as total,
             @i := @i + 1   as rk
      from score as s,
           (select @i = 0) as t
      group by s.s_id
      order by total desc;
      ~~~

      测试SQL代码②:

      ~~~mysql
      select @i;
      ~~~

      第一次执行①再执行②得到的`@i`值为6，第二次重复①和②得到的`@i`值为12，依次递增,这就说明，你所定义的用户变量是用来暂存值的，此变量直到连接断开才被释放，`:=`是赋值，而`:`只是取其值而已。

#### 日期转换

- `DATE_FORMAT(DATE,FORMAT)`，按照指定的format格式对date日期进行格式化

  ~~~mysql
  SELECT DATE_FORMAT('2020-08-15','%m%d'); --  0815
  select DATE_FORMAT(curdate(),'%Y-%m-%d'); -- 2020-08-16
  ~~~

- `WEEK(DATE)`得到指定日期在该年中的第多少周 （DATE为完整日期）

- `MONTH(DATE)` 得到指定日期是该年的第多少月（DATE为完整日期）

- `DAY(DATE)`得到指定日期是该月的第多少天（DATE为完整日期）

- 获取周一和周日

  ~~~mysql
  select subdate(curdate(),date_format(curdate(),'%w')-1)//获取当前日期在本周的周一
  
  select subdate(curdate(),date_format(curdate(),'%w')-7)//获取当前日期在本周的周日
  
  注意:%w 是以数字的形式来表示周中的天数（ 0 = Sunday, 1=Monday, . . ., 6=Saturday），0为周日，6为周六
  ~~~

- 日期格式化

  ~~~mysql
  %y -- 该日期在本世纪中第多少年
  %m -- 该日期在本年中第多少月
  %d -- 该日期在本月中第多少天
  %w -- 该日期距离上一个周日有多少天
  ~~~

  

### 题设条件

~~~mysql
--建表
--学生表
CREATE TABLE `Student`(
	`s_id` VARCHAR(20),
	`s_name` VARCHAR(20) NOT NULL DEFAULT '',
	`s_birth` VARCHAR(20) NOT NULL DEFAULT '',
	`s_sex` VARCHAR(10) NOT NULL DEFAULT '',
	PRIMARY KEY(`s_id`)
);
--课程表
CREATE TABLE `Course`(
	`c_id`  VARCHAR(20),
	`c_name` VARCHAR(20) NOT NULL DEFAULT '',
	`t_id` VARCHAR(20) NOT NULL,
	PRIMARY KEY(`c_id`)
);
--教师表
CREATE TABLE `Teacher`(
	`t_id` VARCHAR(20),
	`t_name` VARCHAR(20) NOT NULL DEFAULT '',
	PRIMARY KEY(`t_id`)
);
--成绩表
CREATE TABLE `Score`(
	`s_id` VARCHAR(20),
	`c_id`  VARCHAR(20),
	`s_score` INT(3),
	PRIMARY KEY(`s_id`,`c_id`)
);
--插入学生表测试数据
insert into Student values('01' , '赵雷' , '1990-01-01' , '男');
insert into Student values('02' , '钱电' , '1990-12-21' , '男');
insert into Student values('03' , '孙风' , '1990-05-20' , '男');
insert into Student values('04' , '李云' , '1990-08-06' , '男');
insert into Student values('05' , '周梅' , '1991-12-01' , '女');
insert into Student values('06' , '吴兰' , '1992-03-01' , '女');
insert into Student values('07' , '郑竹' , '1989-07-01' , '女');
insert into Student values('08' , '王菊' , '1990-01-20' , '女');
--课程表测试数据
insert into Course values('01' , '语文' , '02');
insert into Course values('02' , '数学' , '01');
insert into Course values('03' , '英语' , '03');

--教师表测试数据
insert into Teacher values('01' , '张三');
insert into Teacher values('02' , '李四');
insert into Teacher values('03' , '王五');

--成绩表测试数据
insert into Score values('01' , '01' , 80);
insert into Score values('01' , '02' , 90);
insert into Score values('01' , '03' , 99);
insert into Score values('02' , '01' , 70);
insert into Score values('02' , '02' , 60);
insert into Score values('02' , '03' , 80);
insert into Score values('03' , '01' , 80);
insert into Score values('03' , '02' , 80);
insert into Score values('03' , '03' , 80);
insert into Score values('04' , '01' , 50);
insert into Score values('04' , '02' , 30);
insert into Score values('04' , '03' , 20);
insert into Score values('05' , '01' , 76);
insert into Score values('05' , '02' , 87);
insert into Score values('06' , '01' , 31);
insert into Score values('06' , '03' , 34);
insert into Score values('07' , '02' , 89);
insert into Score values('07' , '03' , 98);
~~~



### 题目(1~50)

1、查询"01"课程比"02"课程成绩高的学生的信息及课程分数

~~~mysql
-- 1、查询"01"课程比"02"课程成绩高的学生的信息及课程分数
-- 方式一:
select s.s_id, s.s_name, s.s_birth, s.s_sex, p.s_score
from student as s,
     (
         select a.s_id, a.s_score
         from (select s_id, c_id, s_score
               from score
               where c_id = 01
               group by c_id, s_id) as a,
              (select s_id, c_id, s_score
               from score
               where c_id = 02
               group by c_id, s_id) as b
         where a.s_score > b.s_score
           and a.s_id = b.s_id) as p
where s.s_id = p.s_id;

方式二:
select s3.*,s.s_score,s2.s_score
from score as s
left join score s2 on s.s_id = s2.s_id
left join Student S3 on s.s_id = S3.s_id
where s2.s_score > s.s_score and s.c_id = '02' and  s2.c_id='01';

~~~

2、查询"01"课程比"02"课程成绩低的学生的信息及课程分数

~~~mysql
-- 查询"01"课程比"02"课程成绩低的学生的信息及课程分数
-- 方式一:
select s.s_id, s.s_name, s.s_birth, s.s_sex, p.s_score
from student as s,
     (
         select a.s_id, a.s_score
         from (select s_id, c_id, s_score
               from score
               where c_id = 01
               group by c_id, s_id) as a,
              (select s_id, c_id, s_score
               from score
               where c_id = 02
               group by c_id, s_id) as b
         where a.s_score < b.s_score
           and a.s_id = b.s_id) as p
where s.s_id = p.s_id;

-- 方式二:
select s3.*,s.s_score,s2.s_score
from score as s
left join score s2 on s.s_id = s2.s_id
left join Student S3 on s.s_id = S3.s_id
where s2.s_score < s.s_score and s.c_id = '02' and  s2.c_id='01';
~~~

3、查询平均成绩大于等于60分的同学的学生编号和学生姓名和平均成绩

~~~mysql
-- 3、查询平均成绩大于等于60分的同学的学生编号和学生姓名和平均成绩
select p.s_id, s.s_name, p.score
from (select s_id, sum(s_score) / 3 as score
      from score
      group by s_id) as p,
     student as s
where s.s_id = p.s_id
  and p.score >= 60;

~~~

4、查询平均成绩小于60分的同学的学生编号和学生姓名和平均成绩
	 (包括有成绩的和无成绩的)

~~~mysql
-- 4、查询平均成绩小于60分的同学的学生编号和学生姓名和平均成绩
		-- (包括有成绩的和无成绩的)
select p.s_id, s.s_name, p.score
from (select s_id, sum(s_score) / 3 as score
      from score
      group by s_id) as p,
     student as s
where s.s_id = p.s_id
  and p.score < 60;

~~~



5、查询所有同学的学生编号、学生姓名、选课总数、所有课程的总成绩

~~~mysql
-- 5、查询所有同学的学生编号、学生姓名、选课总数、所有课程的总成绩
select a.s_id as 学生编号,
       s_name as 学生姓名,
       class as 课程总数,
       totalScore as 总成绩
from (select s_id,
             s_name
      from student) as a,
     (select s_id,
             count(c_id)  as class,
             sum(s_score) as totalScore
      from score
      group by s_id) as b
where a.s_id = b.s_id;
~~~

 6、查询"李"姓老师的数量

~~~mysql
-- 6、查询"李"姓老师的数量
select count(*)
from teacher
where t_name like '李%';
~~~

 7、查询学过"张三"老师授课的同学的信息

~~~mysql
select *
from student
where s_id in (
    select s_id
    from score as s
    where s.c_id =
          (select c_id as c
           from course
           where t_id = (
               select t_id
               from teacher
               where t_name = '张三'
           )));
~~~

 8、查询没学过"张三"老师授课的同学的信息

~~~mysql
-- 8、查询没学过"张三"老师授课的同学的信息

select *
from student
where s_id not in (
    select s_id
    from score as s
    where s.c_id =
          (select c_id as c
           from course
           where t_id = (
               select t_id
               from teacher
               where t_name = '张三'
           )));
~~~

 9、查询学过编号为"01"并且也学过编号为"02"的课程的同学的信息

~~~mysql
select c.*
from (select s_id
      from score
      where c_id = 01) as a,
     (select s_id
         from score
         where c_id=02) as b,
     student as c
where c.s_id =a.s_id and c.s_id = b.s_id;
~~~

10、查询学过编号为"01"但是没有学过编号为"02"的课程的同学的信息

~~~mysql
-- 10、查询学过编号为"01"但是没有学过编号为"02"的课程的同学的信息

-- 学过02的同学id
select s_id
from score
where c_id = 02;

-- 没学过02课程的同学id及全部信息
select *
from student
where s_id not in
      (select s_id
       from score
       where c_id = 02);

-- 没学过02课程的同学里学过01课程的同学
select *
from student
where s_id = (
    select s_id
    from score
    where c_id = 01
      and s_id in
          (select s_id
           from student
           where s_id not in
                 (select s_id
                  from score
                  where c_id = 02)));
~~~

 11、查询没有学全所有课程的同学的信息

~~~mysql
-- 11、查询没有学全所有课程的同学的信息
-- 1.一门课都没学
-- 2.学了两门课
-- 3.学了一门课
# 等价于没有学三门课的同学

-- 学的课程数少于三门的学生id和所学课程数
select s_id, count(s_id) as num
from score
group by s_id
having count(s_id) < (select count(*) from course);

select *
from student
where s_id in
      (select s_id
       from score
       group by s_id
       having count(s_id) < (select count(*)
                             from course));

~~~

 12、查询至少有一门课与(学号为"01"的同学)所学相同的同学的信息

~~~mysql

-- 12、查询至少有一门课与(学号为"01"的同学)所学相同的同学的信息
# 01同学学了01 02 03三门课
# 只要学了01 02 03 三门课其中至少一门课就应该筛选出来该同学
select *
from student
where s_id in (
    select distinct s_id
    from score
    where c_id in (select c_id from score where s_id = '01'));
~~~



 13、查询和"01"号的同学学习的课程完全相同的其他同学的信息

~~~mysql
-- 13、查询和"01"号的同学学习的课程完全相同的其他同学的信息
# 学号为01的同学了学了三门课
# 三门课分别是 01 02 03
# 学了01 02 03这三门课全部课程的应该被筛选出来

# 某个同学学过的课程数为3并且其所学课程都在01同学所学的课程里，一定是01 02 03 这三门课了
select s.*
from score as a
         right join student s on a.s_id = s.s_id
where a.c_id in (select c_id
                 from score
                 where s_id = '01')
group by a.s_id
having count(a.c_id) = (select count(c_id) from score where s_id = '01');

~~~

14、查询[没]学过"张三"老师讲授的任一门课程的学生姓名

~~~mysql
-- 14、查询[没]学过"张三"老师讲授的任一门课程的学生姓名
-- 先查出"张三"老师教授的课程
select c_id
from course
where c_id =
      (select t_id
       from teacher
       where t_name = '张三');

select s_name
from student
where s_id not in (
    select s_id
    from score
    where c_id = (select c_id
                  from course
                  where t_id =
                        (select t_id
                         from teacher
                         where t_name = '张三')));
~~~



 15、查询两门及其以上不及格课程的同学的学号，姓名及其平均成绩

~~~mysql
-- 15、查询两门及其以上不及格课程的同学的学号，姓名及其平均成绩
# 所学的课程不及格的数量达到了2及以上
# 以不及格的条件来筛选查询出来学号、平均成绩

select p.s_id, s.s_name, p.平均成绩
from (select a.s_id, sum(a.s_score) / count(a.c_id) as '平均成绩'
      from score as a
      where a.s_score < 60
      group by s_id
      having count(a.s_id) >= 2) as p,
     student as s
where s.s_id = p.s_id;
~~~

16、检索"01"课程分数小于60，按分数降序排列的学生信息

~~~mysql
-- 16、检索"01"课程分数小于60，按分数降序排列的学生信息
select b.*, a.c_id, a.s_score
from score as a,
     student as b
where a.s_score < 60
  and a.c_id = '01'
  and a.s_id = b.s_id
order by a.s_score desc;
~~~

17、按平均成绩从高到低显示所有学生的所有课程的成绩以及平均成绩

~~~mysql
-- 17、按平均成绩从高到低显示所有学生的所有课程的成绩以及平均成绩
# 按平均成绩排序的学号和对应的平均成绩
select a.s_id, avg(a.s_score) as `avg`
from score as a
group by a.s_id
order by avg desc;

-- 以score表的原生样式展示，看看就好
select q.s_id, c.c_name, q.s_score, p.avg
from score as q,
     (select a.s_id, avg(a.s_score) as avg
      from score as a
      group by a.s_id
      order by avg desc) as p,
     course as c
where q.s_id = p.s_id
  and q.c_id = c.c_id
order by p.avg desc;

-- 更为人性化的显示
select d.s_id,
       (select s_score from score as a where a.s_id = d.s_id and a.c_id = '01') as '语文',
       (select s_score from score as a where a.s_id = d.s_id and a.c_id = '02') as '数学',
       (select s_score from score as a where a.s_id = d.s_id and a.c_id = '03') as '英语',
       avg(s_score)                                                             as '平均分'
from score as d
group by d.s_id
order by 平均分 desc;
~~~



18.查询各科成绩最高分、最低分和平均分：以如下形式显示：课程ID，课程name，最高分，最低分，平均分，及格率，中等率，优良率，优秀率
-- 及格为>=60，中等为：70-80，优良为：80-90，优秀为：>=90

~~~mysql
-- 18.查询各科成绩最高分、最低分和平均分：以如下形式显示：课程ID，课程name，最高分，最低分，平均分，及格率，中等率，优良率，优秀率
-- 及格为>=60，中等为：70-80，优良为：80-90，优秀为：>=90

select a.c_id                                                                                      as 课程ID,
       b.c_name                                                                                    as 课程name,
       max(s_score)                                                                                as 最高分,
       min(s_score)                                                                                as 最低分,
       round(avg(s_score), 2)                                                                      as 平均分,
       round(sum(case when s_score >= 60 then 1 else 0 end) / count(s_score) * 100, 2)             as 及格率,
       round(sum(case when s_score between 70 and 80 then 1 else 0 end) / count(s_score) * 100, 2) as 中等率,
       round(sum(case when s_score between 80 and 90 then 1 else 0 end) / count(s_score) * 100, 2) as 优良率,
       round(sum(case when s_score >= 90 then 1 else 0 end) / count(s_score) * 100, 2)             as 优秀率
from score as a,
     course as b
where a.c_id = b.c_id
group by a.c_id;
~~~

19、按各科成绩进行排序，并显示排名

~~~mysql
-- 19、按各科成绩进行排序，并显示排名
-- 使用rank函数
select a.* ,
       dense_rank() over (order by a.s_score desc ) as '排名'
from score as a
group by s_id,c_id,s_score
order by s_score desc ;

-- 不使用rank函数
select p.s_id,
       p.c_id,
       -- 查询到一条就自增1
       @i := @i + 1                                             as `dense_rank`,
       -- 当查询到和前一天一样时，不自增，否则和i一样
       @k := (case when @score = p.s_score then @k else @i end) as `rank`,
       @score := p.s_score
from (select s.*
      from score as s
      group by s.s_id, s.c_id, s_score
      order by s.s_score desc) as p,
     -- 对变量值进行初始化
     (select @k := 0,@i :=0, @score := 0) as q;
~~~

20、查询学生的总成绩并进行排名

~~~mysql
-- 20、查询学生的总成绩并进行排名
-- 使用rank函数
select a.s_id                                            as 学号,
       sum(a.s_score)                                    as 总成绩,
       dense_rank() over (order by sum(a.s_score) desc ) as 名次
from score as a
group by a.s_id;

-- 不使用rank函数
select s.s_id,
       sum(s.s_score) as total,
       @i := @i + 1   as rk
from score as s,
     (select @i := 0) as t
group by s.s_id
order by total desc;
~~~



21、查询不同老师所教不同课程平均分从高到低显示

~~~mysql
-- 21、查询不同老师所教不同课程平均分从高到低显示

# 先查出不同课程的平局分
select s.c_id, round(avg(s.s_score), 2) as `avg`
from score as s
group by s.c_id;

select t.t_name, c.c_name,  a.avg
from teacher as t,
     course as c,
     (select s.c_id, round(avg(s.s_score), 2) as `avg`
      from score as s
      group by s.c_id) as a
where c.t_id = t.t_id and a.c_id = c.c_id
order by avg desc ;

~~~



22、查询所有课程的成绩第2名到第3名的学生信息及该课程成绩

```
在mysql中if()函数的用法类似于java中的三目表达式，其用处也比较多，具体语法如下：
IF(expr1,expr2,expr3)，如果expr1的值为true，则返回expr2的值，如果expr1的值为false，
则返回expr3的值。
```

~~~mysql
-- 22、查询所有课程的成绩第2名到第3名的学生信息及该课程成绩
-- 方式一:按课程分别取出第二第三名再将得到的拼接，有点冗长
select m.s_id as '学号',m.c_name as '科目', stu.s_name as '姓名' ,stu.s_birth ,stu.s_sex,m.s_score
from (select s_id, c_name, s_score
      from (
            ((select s.s_id, s.c_id, s.s_score
              from score as s
              where c_id = '01'
              order by s.s_score desc
              limit 1,2)
             union all
             (select s.s_id, s.c_id, s.s_score
              from score as s
              where c_id = '02'
              order by s.s_score desc
              limit 1,2)
             union all
             (select s.s_id, s.c_id, s.s_score
              from score as s
              where c_id = '03'
              order by s.s_score desc
              limit 1,2)) as q
               left join course as c on q.c_id = c.c_id)) as m,
     student as stu
where stu.s_id = m.s_id;
-- 方式二:较为精简
select q.*, c.c_name, crk.s_score, crk.rk
from ( # 按课程分类查询并排名次
         select a.s_id,
                a.c_id,
                a.s_score,
                # 如果之前查询到的课程和本次查询到的一致，就把i加一，表示名次递增，否则将i置为1，表示名次重头开始计
                if(@ci = a.c_id, @i := @i + 1, @i := 1) as rk,
                @ci := a.c_id
         from (# 按课程分类查询分数
                  select s.s_id, s.c_id, s.s_score
                  from score as s
                  group by s.s_id, s.c_id, s.s_score
                  order by s.c_id, s.s_score desc) as a
                  join (select @i := 0, @ci := '') as b) as crk
         left join student as q on q.s_id = crk.s_id
         left join course as c on crk.c_id = c.c_id
where crk.rk = 2
   or crk.rk = 3;

-- 方式三:根据25题和42题改编的写法
select s.*, p.s_score
from (select a.s_id,
             a.c_id,
             a.s_score,
             if(@ci = a.c_id, @i := @i + 1, @i := 1) as rk,
             @ci := a.c_id
      from score as a
               join (SELECT @i := 0, @ci := '') as t
      where (select count(1) from score as b where b.c_id = a.c_id and b.s_score > a.s_score) < 3
      order by a.c_id, a.s_score desc) as p
         left join student as s on s.s_id = p.s_id
where p.rk = 2
   or p.rk = 3;

~~~



 23、统计各科成绩各分数段人数：课程编号,课程名称,[100-85],[85-70],[70-60],[0-60]及所占百分比

~~~mysql
-- 23、统计各科成绩各分数段人数：课程编号,课程名称,[100-85],[85-70],[70-60],[0-60]及所占百分比
select *
from (select a.c_id,
             c.c_name,
             sum(case when a.s_score between 85 and 100 then 1 else 0 end) as `[100-85]`,
             round(sum(case when a.s_score between 85 and 100 then 1 else 0 end)/count(s_score),2) as `[100-85]百分比`,
             sum(case when a.s_score between 70 and 84 then 1 else 0 end)  as `[85-70]`,
             round(100*sum(case when a.s_score between 70 and 84 then 1 else 0 end)/count(s_score),2) as `[85-70]百分比`,
             sum(case when a.s_score between 60 and 69 then 1 else 0 end)  as `[70-60]`,
             round(100*sum(case when a.s_score between 60 and 69 then 1 else 0 end)/count(s_score),2) as `[70-60]百分比`,
             sum(case when a.s_score between 0 and 59 then 1 else 0 end)   as `[0-60]`,
             round(100*sum(case when a.s_score between 0 and 59 then 1 else 0 end)/count(s_score),2) as `[0-60]百分比`
      from ((select *
             from score as s
             where c_id = '01') as a
               left join course as c on a.c_id = c.c_id)
      union all
      select a.c_id,
             c.c_name,
             sum(case when a.s_score between 85 and 100 then 1 else 0 end) as `[100-85]`,
             round(sum(case when a.s_score between 85 and 100 then 1 else 0 end)/count(s_score),2) as `[100-85]百分比`,
             sum(case when a.s_score between 70 and 84 then 1 else 0 end)  as `[85-70]`,
             round(100*sum(case when a.s_score between 70 and 84 then 1 else 0 end)/count(s_score),2) as `[85-70]百分比`,
             sum(case when a.s_score between 60 and 69 then 1 else 0 end)  as `[70-60]`,
             round(100*sum(case when a.s_score between 60 and 69 then 1 else 0 end)/count(s_score),2) as `[70-60]百分比`,
             sum(case when a.s_score between 0 and 59 then 1 else 0 end)   as `[0-60]`,
             round(100*sum(case when a.s_score between 0 and 59 then 1 else 0 end)/count(s_score),2) as `[0-60]百分比`
      from ((select *
             from score as s
             where c_id = '02') as a
               left join course as c on a.c_id = c.c_id)
      union all
      select a.c_id,
             c.c_name,
             sum(case when a.s_score between 85 and 100 then 1 else 0 end) as `[100-85]`,
             round(sum(case when a.s_score between 85 and 100 then 1 else 0 end)/count(s_score),2) as `[100-85]百分比`,
             sum(case when a.s_score between 70 and 84 then 1 else 0 end)  as `[85-70]`,
             round(100*sum(case when a.s_score between 70 and 84 then 1 else 0 end)/count(s_score),2) as `[85-70]百分比`,
             sum(case when a.s_score between 60 and 69 then 1 else 0 end)  as `[70-60]`,
             round(100*sum(case when a.s_score between 60 and 69 then 1 else 0 end)/count(s_score),2) as `[70-60]百分比`,
             sum(case when a.s_score between 0 and 59 then 1 else 0 end)   as `[0-60]`,
             round(100*sum(case when a.s_score between 0 and 59 then 1 else 0 end)/count(s_score),2) as `[0-60]百分比`
      from ((select *
             from score as s
             where c_id = '03') as a
               left join course as c on a.c_id = c.c_id)) as n;


-- 参考答案:
select distinct f.c_name,a.c_id,b.`85-100`,b.百分比,c.`70-85`,c.百分比,d.`60-70`,d.百分比,e.`0-60`,e.百分比 from score a
				left join (select c_id,SUM(case when s_score >85 and s_score <=100 then 1 else 0 end) as `85-100`,
											ROUND(100*(SUM(case when s_score >85 and s_score <=100 then 1 else 0 end)/count(*)),2) as 百分比
								from score GROUP BY c_id)b on a.c_id=b.c_id
				left join (select c_id,SUM(case when s_score >70 and s_score <=85 then 1 else 0 end) as `70-85`,
											ROUND(100*(SUM(case when s_score >70 and s_score <=85 then 1 else 0 end)/count(*)),2) as 百分比
								from score GROUP BY c_id)c on a.c_id=c.c_id
				left join (select c_id,SUM(case when s_score >60 and s_score <=70 then 1 else 0 end) as `60-70`,
											ROUND(100*(SUM(case when s_score >60 and s_score <=70 then 1 else 0 end)/count(*)),2) as 百分比
								from score GROUP BY c_id)d on a.c_id=d.c_id
				left join (select c_id,SUM(case when s_score >=0 and s_score <=60 then 1 else 0 end) as `0-60`,
											ROUND(100*(SUM(case when s_score >=0 and s_score <=60 then 1 else 0 end)/count(*)),2) as 百分比
								from score GROUP BY c_id)e on a.c_id=e.c_id
				left join course f on a.c_id = f.c_id

~~~



24、查询学生平均成绩及其名次

~~~mysql

-- 24、查询学生平均成绩及其名次

select s.s_id as '学号',
       round(avg(s.s_score),2) as '平均成绩',
       dense_rank() over (order by avg(s.s_score) desc ) as '名次'
from score as s
group by s.s_id
~~~



25、查询各科成绩前三名的记录

~~~mysql
-- 25、查询各科成绩前三名的记录
-- 1.选出b表比a表成绩大的所有组
-- 2.选出比当前id成绩大的 小于三个的
-- 参考答案:
select a.s_id, a.c_id, a.s_score
from score a
         left join score b on a.c_id = b.c_id and a.s_score < b.s_score
group by a.s_id, a.c_id, a.s_score
HAVING COUNT(b.s_id) < 3
ORDER BY a.c_id, a.s_score DESC;

-- 类似于第42题，高级简化写法
select a.s_id, a.c_id, a.s_score
from score as a
where (select count(1) from score as b where b.c_id = a.c_id and b.s_score > a.s_score) < 3
order by a.c_id;

-- 解法一 分别按照课程查成绩前三的，再把表拼接，方法愚笨
(select *
 from score as s
 where s.c_id = '01'
 order by s.s_score desc
 limit 1,3)
union all
(select *
 from score as s
 where s.c_id = '02'
 order by s.s_score desc
 limit 1,3)
union all
(select *
 from score as s
 where s.c_id = '03'
 order by s.s_score desc
 limit 1,3);

-- 方法二 参考了答案，将两个表联合，并将表二中比表一大的前两个拿出来
select a.s_id, a.c_id, a.s_score
from score as a
         left join score as b
                   on a.c_id = b.c_id and b.s_score > a.s_score
group by a.c_id, a.s_id, a.s_score
having count(b.s_score) < 3
order by a.c_id, a.s_score desc;
~~~



26、查询每门课程被选修的学生数

~~~mysql
-- 26、查询每门课程被选修的学生数
select s.c_id,count(s.s_id)
from score s
group by s.c_id;
~~~

27、查询出只有两门课程的全部学生的学号和姓名

~~~mysql
-- 27、查询出只有两门课程的全部学生的学号和姓名
select s.s_id, s2.s_name
from score as s
left join student s2 on s.s_id = s2.s_id
group by s.s_id
having count(s.c_id) = 2;
~~~

28、查询男生、女生人数

~~~mysql
-- 28、查询男生、女生人数
select s.s_sex,count(s.s_sex)
from student as s
group by s.s_sex;

~~~

29、查询名字中含有"风"字的学生信息

~~~mysql
-- 29、查询名字中含有"风"字的学生信息
select *
from student
where s_name like '%风%';
~~~



30、查询同名同性学生名单，并统计同名人数

~~~mysql
-- 30、查询同名同性学生名单，并统计同名人数
select a.s_name, count(a.s_name)
from student as a
         join student b on a.s_id = b.s_id
where a.s_id != b.s_id
  and a.s_name = b.s_name
  and a.s_sex = b.s_sex
group by a.s_name;
~~~



 31、查询1990年出生的学生名单

~~~mysql
-- 31、查询1990年出生的学生名单
select s.s_name
from student s
where s.s_birth like '1990%';
~~~



32、查询每门课程的平均成绩，结果按平均成绩降序排列，平均成绩相同时，按课程编号升序排列

~~~mysql
-- 32、查询每门课程的平均成绩，结果按平均成绩降序排列，平均成绩相同时，按课程编号升序排列
select sc.c_id, avg(sc.s_score) as avg_score
from score as sc
group by sc.c_id
order by avg_score desc, sc.c_id asc ;
~~~

 33、查询平均成绩大于等于85的所有学生的学号、姓名和平均成绩

~~~mysql
-- 33、查询平均成绩大于等于85的所有学生的学号、姓名和平均成绩
select s.s_id,s2.s_name,avg(s.s_score)
from score as s
         left join student s2 on s.s_id = s2.s_id
group by s.s_id
having avg(s.s_score) >= 85;

~~~



34、查询课程名称为"数学"，且分数低于60的学生姓名和分数

~~~mysql
-- 34、查询课程名称为"数学"，且分数低于60的学生姓名和分数
select s2.s_name, s.s_score
from score as s
         left join student s2 on s.s_id = s2.s_id
where s.c_id =
      (select c.c_id
       from course as c
       where c.c_name = '数学')
having s.s_score < 60
~~~

35、查询所有学生的课程及分数情况；

~~~mysql
-- 35、查询所有学生的课程及分数情况；
-- 参考了答案
select a.s_id,
       a.s_name,
       sum(case when c_name = '语文' then s_score else 0 end)    as '语文',
       sum(case when c_name = '数学' then s_score else 0 end)    as '数学',
       sum(case when c_name = '英语' then s_score else 0 end)    as '英语',
       sum(case when s.s_score != 0 then s.s_score else 0 end) as '总分'
from student as a
         left join Score s on a.s_id = S.s_id
         left join Course c on s.c_id = C.c_id
group by a.s_id;
~~~



 36、查询任何一门课程成绩在70分以上的姓名、课程名称和分数；

~~~mysql
-- 36、查询任何一门课程成绩在70分以上的姓名、课程名称和分数；
-- 先查出学生成绩在70分以上的课程和成绩
select *
from score as s
where s.s_score >= 70;

select b.s_name,
       sum(case when c.c_name = '语文' then a.s_score end) as '语文',
       sum(case when c.c_name = '数学' then a.s_score end) as '数学',
       sum(case when c.c_name = '英语' then a.s_score end) as '英语'
from (select *
      from score as s
      where s.s_score >= 70) as a
         left join student as b on a.s_id = b.s_id
         left join course as c on a.c_id = c.c_id
group by b.s_name;
~~~



 37、查询不及格的课程

~~~mysql
-- 37、查询不及格的课程
select s.s_id, c.c_name
from score as s
         left join Course C on s.c_id = C.c_id
where s.s_score < 60;
~~~



 38、查询课程编号为01且课程成绩在80分以上的学生的学号和姓名； 

~~~mysql
-- 38、查询课程编号为01且课程成绩在80分以上的学生的学号和姓名；
select s2.s_id, s2.s_name
from score as s
         left join student s2 on s.s_id = s2.s_id
where s.c_id = '01'
  and s.s_score >= 80;
~~~



39、求每门课程的学生人数

~~~mysql
-- 39、求每门课程的学生人数
select s.c_id, count(s.s_id) as '学生人数'
from score as s
group by s.c_id
~~~



 40、查询选修"张三"老师所授课程的学生中，成绩最高的学生信息及其成绩

~~~mysql
-- 40、查询选修"张三"老师所授课程的学生中，成绩最高的学生信息及其成绩
-- 根据课程分数找出学生id来查询学生信息
select s2.*, n.s_score
from score as n
         left join student s2 on n.s_id = s2.s_id
where n.s_score = (
    select max(s.s_score) as max_score
    from score as s
    where s.c_id = (
        -- 查询老师所教的课程id
        select c.c_id
        from course as c
        where c.t_id = (
            -- 查询老师的id
            select t.t_id
            from teacher as t
            where t.t_name = '张三')));

~~~



 41、查询不同课程成绩相同的学生的学生编号、课程编号、学生成绩

~~~mysql
-- 41、查询不同课程成绩相同的学生的学生编号、课程编号、学生成绩
select a.s_id, b.c_id, b.s_score
from score as a,
     score as b
where a.s_score = b.s_score
  and a.c_id != b.c_id
  and a.s_id = b.s_id
group by a.s_id, b.c_id, b.s_score;
~~~

 42、查询每门功成绩最好的前两名

~~~mysql
-- 42、查询每门功成绩最好的前两名
-- 方法一:较为愚笨 按科目查询之后再拼接
(select s.*
 from score as s
 where s.c_id = '01'
 group by s.c_id, s.s_id
 order by s.s_score desc
 limit 0,2)
union all
(select s.*
 from score as s
 where s.c_id = '02'
 group by s.c_id, s.s_id
 order by s.s_score desc
 limit 0,2)
union all
(select s.*
 from score as s
 where s.c_id = '03'
 group by s.c_id, s.s_id
 order by s.s_score desc
 limit 0,2);

-- 类似于第25题写法，还可以再简化
select a.s_id, a.c_id, a.s_score
from score as a
         left join score b on a.c_id = b.c_id and b.s_score > a.s_score
group by a.c_id, a.s_id, a.s_score
having count(b.s_score) < 2
order by a.c_id, a.s_score desc;

-- 参考答案: 牛逼写法
select a.s_id, a.c_id, a.s_score
from score a
where (select COUNT(1) from score b where b.c_id = a.c_id and b.s_score >= a.s_score) <= 2
ORDER BY a.c_id;

~~~



 43、统计每门课程的学生选修人数（超过5人的课程才统计）。要求输出课程号和选修人数，查询结果按人数降序排列，若人数相同，按课程号升序排列

~~~mysql
-- 43、统计每门课程的学生选修人数（超过5人的课程才统计）。要求输出课程号和
-- 选修人数，查询结果按人数降序排列，若人数相同，按课程号升序排列
select s.c_id, count(s.s_id) as cnt
from score as s
group by s.c_id
having cnt > 5
order by cnt desc, c_id asc;
~~~



44、检索至少选修两门课程的学生学号

~~~mysql
-- 44、检索至少选修两门课程的学生学号
select s.s_id,count(s.s_id)
from score as s
group by s.s_id
having count(s.c_id) >= 2;
~~~



45、查询选修了全部课程的学生信息

~~~mysql
-- 45、查询选修了全部课程的学生信息
# 方法一:
select s2.*
from score as s
         left join student s2 on s.s_id = s2.s_id
group by s.s_id
having count(s.c_id) = (
    select COUNT(*)
    from course);
# 方法二:
select *
from student as s
where s.s_id in
      (
          select s2.s_id
          from score as s2
          group by s2.s_id
          having count(s2.c_id) >= (select count(*) from course)
      )

~~~



46、查询各学生的年龄
-- 按照出生日期来算，当前月日 < 出生年月的月日则，年龄减一

> 关于MySQL日期计算 [点我](https://www.cnblogs.com/jianmingyuan/p/10910222.html)

> 关于truncate()函数 [点我](https://www.cnblogs.com/wudage/p/7524387.html)

~~~mysql
-- 46、查询各学生的年龄
-- 按照出生日期来算，当前月日 < 出生年月的月日则，年龄减一

-- 方法一:
-- truncate(x,y)函数将对小数末尾进行舍去，没有四舍五入
-- str_to_date(date,format)将对字符串日期进行格式化
select s.s_id,
       case
           when str_to_date(now(), '%m-%d') < str_to_date(s.s_birth, '%m-%d') then
                   truncate(datediff(str_to_date(now(), '%Y-%m-%d'), str_to_date(s.s_birth, '%Y-%m-%d')) / 365, 0) - 1
           else
               truncate(datediff(str_to_date(now(), '%Y-%m-%d'), str_to_date(s.s_birth, '%Y-%m-%d')) / 365, 0) end
from student as s
group by s.s_id;

-- 方法二:
select s_birth,
       (DATE_FORMAT(NOW(), '%Y') - DATE_FORMAT(s_birth, '%Y') -
        (case when DATE_FORMAT(NOW(), '%m%d') > DATE_FORMAT(s_birth, '%m%d') then 0 else 1 end)) as age
from student;
~~~



47、查询本周过生日的学生

~~~mysql
-- 47、查询本周过生日的学生

-- 方法一:
# 将所有同学的生日日期转化为对应的月日格式再与本周的周一和周日进行比较
# 该月日比周一大，比周日小
select s.*
from student as s
where date_format(s.s_birth, '%m-%d') >=
      date_format((select subdate(curdate(), date_format(curdate(), '%w') - 1)), '%m-%d')
  and date_format((select subdate(curdate(), date_format(curdate(), '%w') - 7)), '%m-%d') >=
      date_format(s.s_birth, '%m-%d');

-- 方法二:
select s.*
from student as s
where week(date_format(s.s_birth,'%Y%m%d')) = week(date_format(now(), '%Y%m%d'));
~~~



 48、查询下周过生日的学生

~~~mysql
-- 48、查询下周过生日的学生
-- 方法一:
select s.*
from student as s
where date_format(s.s_birth, '%m-%d') >
      date_format((select subdate(curdate() + 7, date_format(curdate() + 7, '%w') - 1)), '%m-%d')
  and date_format((select subdate(curdate() + 7, date_format(curdate() + 7, '%w') - 7)), '%m-%d') >
      date_format(s.s_birth, '%m-%d');

-- 方法二:
select s.*
from student as s
where week(date_format(s.s_birth,'%Y%m%d')) = week(date_format(now(), '%Y%m%d'))+1;
~~~



49、查询本月过生日的学生

~~~mysql
-- 49、查询本月过生日的学生
-- 生日在本月月初和月末之间 也就是生日的月份与本月的月份相同
-- 方法一:
select s.*
from student as s
where date_format(s.s_birth, '%m') = date_format(curdate(), '%m');

-- 方法二:
select s.*
from student as s
where month(s.s_birth) = month(date_format(now(), '%Y%m%d'));
~~~



50、查询下月过生日的学生

~~~mysql
-- 50、查询下月过生日的学生
-- 方法一:
select s.*
from student as s
where date_format(s.s_birth, '%m') = date_format(curdate(), '%m') + 1;

-- 方法二:
select s.*
from student as s
where month(s.s_birth) = month(date_format(now(), '%Y%m%d')) + 1;
~~~

