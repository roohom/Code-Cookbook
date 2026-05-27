# [Spark]SparkSQL JDBC并发连接读取

## 前言

SparkSQL提供了一套统一的API去通过JDBC读取Data Sources，即

~~~java
spark.read.format("jdbc")
.option("url", jdbcUrl)
.option("driver", xxxx.class)
.option("key", "value")
.load()
~~~

我们需要配置的参数都通过`.option`来传入

使用这套API简单方便，但是读取JDBC数据源的时候是单连接的，如何能充分发挥分布式服务的特点，并发连接去读取数据源呢？

**Spark是支持的。**



## 配置说明

通过仔细阅读[官网](http://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)可以看到SparkSQL通过JDBC读取数据源的时候提供了这样的参数：

> partitionColumn, lowerBound, upperBound
>
> These options must all be specified if any of them is specified. In addition, `numPartitions` must be specified. They describe how to partition the table when reading in parallel from multiple workers. `partitionColumn` must be a numeric, date, or timestamp column from the table in question. Notice that `lowerBound` and `upperBound` are just used to decide the partition stride, not for filtering the rows in table. So all rows in the table will be partitioned and returned. This option applies only to reading.

> numPartitions
>
>  The maximum number of partitions that can be used for parallelism in table reading and writing. This also determines the maximum number of concurrent JDBC connections. If the number of partitions to write exceeds this limit, we decrease it to this limit by calling `coalesce(numPartitions)` before writing.

如上是官网的详细说明，意思就是说，当配置了`partitionColumn`,` lowerBound`, `upperBound`这三个其中任意一个的时候，其他两个都必须要配置，并且如果想要生效吗，还必须配置`numPartitions`这个参数，这些参数描述了当多个worker并行地读取表的时候如何将这个表的数据进行分区(partition)，并且这些参数有一些要求：

- `partitionColumn`必须是**数值类型的、日期或者时间戳之类的列**
- `lowerBound` 和`upperBound`描述了数据分区的上下边界，而不是为了过滤数据(表的**所有数据都会被返回**，这些参数仅仅用在读取的时候生效)
- `numPartitions`最大的分区数量，这个参数将会被应用在并行地读取和写入表的时候。这个参数也定义了**并发连接JDBC的连接数**(如果在写入数据的时候分区大于该参数，将会在写入之前调用coalesce参数进行分区的削减)



## 示例：

~~~java
spark.read.format("jdbc")
.option("url", jdbcUrl)
.option("dbtable", "(select c1, c2 from t1) as tmp")
.option("lowerBound",0)
.option("upperBound",20000)
.option("partitionColumn","id")
.option("numPartitions", 5)
.load()
~~~

当调用触发函数的时候，以上连接就会开始从数据源进行读取数据，

- 下限是0，上限是20000
- 用来进行分区的列是`id`，该列必须在源表中存在
- 分区的数量是5，也就是spark在读取数据源的时候会并发的启用5个JDBC连接

当开始执行的时候，通过Spark WebUI上的stages中看到5个task同时执行。