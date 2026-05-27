# WITH AS

[详细使用](https://www.cnblogs.com/Niko12230/p/5945133.html)

## 功能

这种写法称为CTE，将子查询语句置前，提高SQL代码的可读性和便于维护，某些情况下提高查询的效率



## 使用方法

举个栗子：

~~~SQL
WITH tmp AS
(SELECT id FROM stu)
SELECT * FROM score AS s WHERE s.id IN tmp;
~~~

而不使用WITH AS 写法则需要这样写：

~~~SQL
SELECT * 
FROM score s
WHERE s.id in
	(SELECT id FROM stu) AS tmp;
~~~



## 注意事项

- CTE后面必须直接跟使用CTE的SQL语句（如select、insert、update等），否则，CTE将失效。如下面的SQL语句将无法正常使用CTE：

- CTE后面也可以跟其他的CTE，但只能使用一个with，多个CTE中间用逗号（,）分隔，如下面的SQL语句所示：

  ~~~SQL
  with
  cte1 as
  (
      select * from table1 where name like 'abc%'
  ),
  cte2 as
  (
      select * from table2 where id > 20
  ),
  cte3 as
  (
      select * from table3 where price < 100
  )
  select a.* from cte1 a, cte2 b, cte3 c where a.id = b.id and a.id = c.id
  ~~~

- ……