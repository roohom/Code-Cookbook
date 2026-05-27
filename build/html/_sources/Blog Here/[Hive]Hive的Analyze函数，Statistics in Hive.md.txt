# [Hive]Hive的Analyze函数，Statistics in Hive

详细的介绍可以见[Hive官网](https://cwiki.apache.org/confluence/display/Hive/StatsDev)

## 事件经过

一个Hive表的数据，底层HDFS上的数据直接被移到该表的路径下，在这操作之后，使用

~~~SQL
SELECT COUNT(1) FROM table_name;
~~~

查询结果为0，而使用

~~~SQL
SELECT * FROM table_name LIMIT 1;
~~~

却可以查询到实际的值，按道理，这不应该。

## 分析和总结

原来，在使用查询语句的时候，例如一些简单的查询语句，Hive会对其进行优化，而优化的更具就是Hive对表的统计信息，比如

- 行数（Number of rows）
- 文件数（Number of files）
- 文件大小（Size in Bytes）

以及一些列的统计信息。



> Statistics such as the number of rows of a table or partition and the histograms of a particular interesting column are important in many ways. One of the key use cases of statistics is query optimization. Statistics serve as the input to the cost functions of the optimizer so that it can compare different plans and choose among them. Statistics may sometimes meet the purpose of the users' queries. Users can quickly get the answers for some of their queries by only querying stored statistics rather than firing long-running execution plans. Some examples are getting the quantile of the users' age distribution, the top 10 apps that are used by people, and the number of distinct sessions.

由于根据统计信息的优化，用户有时候能快速地得到想要的查询结果，而不是经过长时间运行程序后得到结果。

回到刚开始的问题，当我们使用`SELECT COUNT(1)`的时候，Hive直接送Metastore里面获取该表数据总数，由于存储该表的元数据没有被刷新，所以为0，很快得到结果，而使用`SELECT *`的时候，出发了MapReduce计算，会从实际存储数据的路径的HDFS上获取数据进行计算，也就得到了实际的数据，造成两条SQL结果的不对应。



既然原因知道了，那么怎么刷新元数据呢，就需要使用到Hive的Analyze命令。



### 新创建的表

当使用`INSERT OVERWRITE `命令时，统计数据会默认自动地被计算并存储到Hive MetaStore

### 已经存在的表

用户可以使用以下命令收集统计数据并刷写到Hive Metastore

~~~SQL
ANALYZE TABLE [db_name.]tablename [PARTITION(partcol1[=val1], partcol2[=val2], ...)]  -- (Note: Fully support qualified table name since Hive 1.2.0, see HIVE-10007.)
  COMPUTE STATISTICS 
  [FOR COLUMNS]          -- (Note: Hive 0.10.0 and later.)
  [CACHE METADATA]       -- (Note: Hive 2.1.0 and later.)
  [NOSCAN];
~~~

举例子：

~~~SQL
ANALYZE TABLE Table1 PARTITION(ds='2008-04-09', hr=11) COMPUTE STATISTICS; --仅仅为PARTITION(ds='2008-04-09', hr=11)收集统计数据

ANALYZE TABLE Table1 PARTITION(ds, hr) COMPUTE STATISTICS; --为全表所有的分区收集统计数据
~~~



可以使用`DESCRIBE EXTENDED table_name`来查看表的统计数据。