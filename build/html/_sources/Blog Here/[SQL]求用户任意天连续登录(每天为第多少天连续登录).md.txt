# [SQL]求用户任意天连续登录(每天为第多少天连续登录)

## 废话在前

有这样一个需求：<u>求用户每天为第多少天连续登录，也就是说在每天的登录数据后面显示该天为第几天连续登录</u>



求用户是连续三天、连续七天连续登录的场景方案和答案已经很多，但是在一个计算结果中同时显示每天是第多少天连续登录的解答好像很少，并且这种答案适合于求任意天数的连续登录问题。话不多少，开干。



## 原始数据

这里假设登录数据已经经过去重，每天的登录数据仅为1条，方便演示

~~~SQL
+---+----------+
| id|login_date|
+---+----------+
|  1|2021-08-01|
|  1|2021-08-02|
|  1|2021-08-03|
|  2|2021-08-01|
|  2|2021-08-02|
|  4|2021-08-01|
|  4|2021-08-03|
|  4|2021-08-05|
|  4|2021-08-06|
|  1|2021-08-06|
|  1|2021-08-07|
|  1|2021-08-08|
|  2|2021-08-08|
|  3|2021-08-08|
|  1|2021-08-09|
+---+----------+
~~~



## 开始分析

咱们的分析在Jupter Lab中使用Spark来创建数据并且使用SparkSQL分析。

### 创建数据源

~~~Python
from pyspark.sql import SparkSession
spark = SparkSession.builder.master("local[*]").appName("SparkLocal").getOrCreate()

from pyspark.sql import Row
df = spark.createDataFrame([
    Row(id=1, login_date='2021-08-01'),
    Row(id=1, login_date='2021-08-02'),
    Row(id=1, login_date='2021-08-03'),
    Row(id=2, login_date='2021-08-01'),
    Row(id=2, login_date='2021-08-02'),
    Row(id=4, login_date='2021-08-01'),
    Row(id=4, login_date='2021-08-03'),
    Row(id=4, login_date='2021-08-05'),
    Row(id=4, login_date='2021-08-06'),
    Row(id=1, login_date='2021-08-06'),
    Row(id=1, login_date='2021-08-07'),
    Row(id=1, login_date='2021-08-08'),
    Row(id=2, login_date='2021-08-08'),
    Row(id=3, login_date='2021-08-08'),
    Row(id=1, login_date='2021-08-09')
])

df.createOrReplaceTempView("login_data")
spark.sql("select * from login_data").show()
~~~

~~~SQL
+---+----------+
| id|login_date|
+---+----------+
|  1|2021-08-01|
|  1|2021-08-02|
|  1|2021-08-03|
|  2|2021-08-01|
|  2|2021-08-02|
|  4|2021-08-01|
|  4|2021-08-03|
|  4|2021-08-05|
|  4|2021-08-06|
|  1|2021-08-06|
|  1|2021-08-07|
|  1|2021-08-08|
|  2|2021-08-08|
|  3|2021-08-08|
|  1|2021-08-09|
+---+----------+
~~~



### 一步两步，似魔鬼的步伐

先使用`ROW_NUMBER() OVER()`分析看看

~~~python
stepSql5 = """
select id,
       login_date,
       row_number() over (partition by id order by login_date asc) as rk
from login_data

"""
~~~

结果

~~~SQL
+---+----------+---+
| id|login_date| rk|
+---+----------+---+
|  1|2021-08-01|  1|
|  1|2021-08-02|  2|
|  1|2021-08-03|  3|
|  1|2021-08-06|  4|
|  1|2021-08-07|  5|
|  1|2021-08-08|  6|
|  1|2021-08-09|  7|
|  3|2021-08-08|  1|
|  2|2021-08-01|  1|
|  2|2021-08-02|  2|
|  2|2021-08-08|  3|
|  4|2021-08-01|  1|
|  4|2021-08-03|  2|
|  4|2021-08-05|  3|
|  4|2021-08-06|  4|
+---+----------+---+
~~~

分析一下，可以看到，如果登录数据是连续登录的，比如对用户id为1的用户来说，2021-08-01到2021-08-03是连续登录的，那么他们的日期和行号之差就是相等的，为2021-07-31，那么就可以按照用户和他们的登录日期和行号之差来分组，也就得到了哪些天是连续登录的

#### 找出连续登录的日期，最大连续天数

~~~python
stepSql6 = """
select id,
       date_sub(login_rk.login_date, rk) as login
       ,min(login_date) as min_date,
       max(login_date) as max_date,
       count(1)
from (
      select id,
             login_date,
             row_number() over (partition by id order by login_date asc) as rk
      from login_data
     ) as login_rk
group by id,date_sub(login_rk.login_date, rk)
"""
~~~

结果：

~~~SQL
+---+----------+----------+----------+--------+
| id|     login|  min_date|  max_date|count(1)|
+---+----------+----------+----------+--------+
|  1|2021-07-31|2021-08-01|2021-08-03|       3|
|  1|2021-08-02|2021-08-06|2021-08-09|       4|
|  3|2021-08-07|2021-08-08|2021-08-08|       1|
|  2|2021-07-31|2021-08-01|2021-08-02|       2|
|  2|2021-08-05|2021-08-08|2021-08-08|       1|
|  4|2021-07-31|2021-08-01|2021-08-01|       1|
|  4|2021-08-01|2021-08-03|2021-08-03|       1|
|  4|2021-08-02|2021-08-05|2021-08-06|       2|
+---+----------+----------+----------+--------+
~~~

上面的login列，就是连续登录的日期和行号之差所得到的相同的日期，min_date和max_date分别为该组里最小和最大的连续登录的日期，count(1)则是连续登录的天数，也就是最大的连续的天数，可是暂时还得不到每天的连续的天数。

不慌，最大的连续登录天数都拿到了，还怕拿不到每天的登录天数？我们再把这个结果拿回去和原始数据join一下，用每天的登录数据去和每组里面的最小日期相减，不就得到了每天的连续登录天数？

#### 结果

~~~python
stepSql7 = """
SELECT login.id,
       login.login_date,
       DATEDIFF(login_date, min_date)+1 as continue_days
FROM(
    SELECT id,
           MIN(login_date) as min_date,
           MAX(login_date) as max_date
    FROM (
          SELECT id,
                 login_date,
                 ROW_NUMBER() OVER (PARTITION BY id ORDER BY login_date ASC) as rk
          FROM login_data
         ) AS login_rk
    GROUP BY id,date_sub(login_rk.login_date, rk)
) AS max_login_days
RIGHT JOIN 
(
SELECT id, login_date FROM login_data
) AS login 
on login.id = max_login_days.id and login.login_date between max_login_days.min_date and max_login_days.max_date 
ORDER BY id
"""
~~~

结果：

~~~SQL
+---+----------+-------------+
| id|login_date|continue_days|
+---+----------+-------------+
|  1|2021-08-01|            1|
|  1|2021-08-02|            2|
|  1|2021-08-03|            3|
|  1|2021-08-06|            1|
|  1|2021-08-07|            2|
|  1|2021-08-08|            3|
|  1|2021-08-09|            4|
|  2|2021-08-01|            1|
|  2|2021-08-02|            2|
|  2|2021-08-08|            1|
|  3|2021-08-08|            1|
|  4|2021-08-01|            1|
|  4|2021-08-03|            1|
|  4|2021-08-05|            1|
|  4|2021-08-06|            2|
+---+----------+-------------+
~~~



