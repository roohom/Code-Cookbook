# [Spark]SparkSQL 列转行的一种方法

## 需求场景

有这样一种场景，数据如下：

~~~sql
+---+---+---+---+---+---+
| id|  A|  B|  C|  D|  E|
+---+---+---+---+---+---+
|  a|  2|  3|  4|  5|  6|
|  b|  4|  2| 10|  3|  4|
|  c|  2|  1|  3|  2|  0|
+---+---+---+---+---+---+
~~~

现在要求按照id将id后的A、B、C、D、E字段打开，得到一个只有两列的结果集，样式如下：

~~~sql
+---+---+
| id| ev|
+---+---+
|  a|  2|
|  a|  3|
|  a|  4|
|  a|  5|
|  a|  6|
|  b|  4|
|  b|  2|
|  b| 10|
|  b|  3|
|  b|  4|
|  c|  2|
|  c|  1|
|  c|  3|
|  c|  2|
|  c|  0|
+---+---+
~~~



## 实际操作

> 我们使用jupyterLab来运行PySpark创建数据并进行分析。

创建数据集，并且结果注册成为临时视图`source`：

~~~python
from pyspark.sql import SparkSession
spark = SparkSession.builder.master("local").getOrCreate()

df = spark.createDataFrame([('a',2,3,4,5,6), ('b',4,2,10,3,4), ('c',2,1,3,2,0)
                           ], ['id','A','B','C','D','E']).orderBy('id')
df.createOrReplaceTempView("source")

df.show()
~~~

结果如下：

~~~ini
+---+---+---+---+---+---+
| id|  A|  B|  C|  D|  E|
+---+---+---+---+---+---+
|  a|  2|  3|  4|  5|  6|
|  b|  4|  2| 10|  3|  4|
|  c|  2|  1|  3|  2|  0|
+---+---+---+---+---+---+
~~~



## 隆重介绍

或许应该有别的方法得到我们想要的结果，但是下面**隆重介绍**一个sparkSQL中的函数，一步即可得到我们想要的结果集。

该函数即为：`STACK(n, expr1, ..., exprk)`

~~~
stack
stack(n, expr1, ..., exprk) - Separates expr1, ..., exprk into n rows. Uses column names col0, col1, etc. by default unless specified otherwise.

Examples:

> SELECT stack(2, 1, 2, 3);
 1  2
 3  NULL
~~~

**该函数将一行以n指定的行数分割成n行**

使用STACK即可像下面这样即可实现我们的需求：

~~~python
sql = """
select id,stack(5,A,B,C,D,E) as (`ev`) 
from source
"""

spark.sql(sql).createOrReplaceTempView("ecplode")
spark.sql("select * from ecplode").show()
~~~

结果如下：

~~~ini
+---+---+
| id| ev|
+---+---+
|  a|  2|
|  a|  3|
|  a|  4|
|  a|  5|
|  a|  6|
|  b|  4|
|  b|  2|
|  b| 10|
|  b|  3|
|  b|  4|
|  c|  2|
|  c|  1|
|  c|  3|
|  c|  2|
|  c|  0|
+---+---+
~~~

