# MySQL语句执行顺序

简单的MySQL语句

~~~MySQL
select 1 from 2 where 3 group by 4 having 5 order by 6 limit 7
~~~



完整语法及编写顺序:

~~~MySQL
SELECT 
DISTINCT <select_list>
FROM <left_table>
<join_type> JOIN <right_table>
ON <join_condition>
WHERE <where_condition>
GROUP BY <group_by_list>
HAVING <having_condition>
ORDER BY <order_by_condition>
LIMIT <limit_number>
~~~

执行顺序

~~~mysql
from → on → join → where → group by → having → select → order by → limit
~~~

~~~mysql
select 8 distinct 9 from 1 join 3 on 2 where 4 group by 5 with 6 having 7  order by 10 limit 11
~~~

