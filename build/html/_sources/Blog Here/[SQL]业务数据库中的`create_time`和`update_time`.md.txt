# [SQL]业务数据库中的`create_time`和`update_time`分析时的问题

一些业务数据库(比如MySQL)中的表结构设计为了表示数据的创建(插入)和更新时间，会有两个字段表示，分别是`create_time`和`update_time`，前者表示该条数据是何时创建或者插入到业务数据库的，后者表示该条数据是何时发生了最近一次更新。

在数仓设计中，明细层(DWD)或者汇总层(DWS)由于底层数据冗余的问题，比如明细层一个用户发省了多次行为，数据虽然发省了更新，但是明细层并不是全量计算，而是增量计算(表为非分区表，新数据每天插入)，这时，在汇总层做一些状态取值需要取最新的时候，就需要根据如题所说的两个字段来对状态进行合适的取舍计算，情况大致会有以下几种。

## 1、根据`update_time`取最新

这时分析函数主要使用`ROW_NUMBER() OVER()`

~~~SQL
ROW_NUMBER() OEVER(PARTITION BY id ORDER BY update_time DESC)
~~~

以上则表示以id分区，update_time倒序排序，将排在第一位的标号为1，在外层筛选数据时只要where rank=1，即刻取到最新的一条。



可是这样的取法存在一个问题，如果出现两个`update_time`相同，但是`create_time`不同的数据时，这时候执行结果就不一定了，而业务库中发生这样的数据是很有可能的(插入新的数据的同时将旧的状态数据一并更新)，往往结果是随机的，结果就不能确保是我们想要的。



## 2、根据`update_time`和`create_time`组合取最新

1中存在的问题，并不难解决，这时候只要稍微改动SQL即可：

~~~SQL
ROW_NUMBER() OEVER(PARTITION BY id ORDER BY update_time DESC, create_time DESC)
~~~

以上则会根据`update_time`倒序排序后，再根据已经排序过的根据`create_time`进行倒序排序，确保取到我们最新的状态。



## 3、根据`create_time`取最新

还有这样一种业务情况存在，`create_time`表示了该条数据的创建(插入)时间，如果再发生需要对该数据进行更新并插入新的数据的情况，两条数据实则是一并更新的，就会有相同的`update_time`，但`create_time`一定不相同

~~~SQL
ROW_NUMBER() OEVER(PARTITION BY id ORDER BY create_time DESC)
~~~

举例：

~~~SQL
id name       status    hight  create_time           update_time
1  xiaoming   active    170    2021-09-13 12:00:01   2021-09-13 12:00:01
------------------------------------------------------------------------
id name       status    hight  create_time           update_time
1  xiaoming   active    170    2021-09-13 12:00:01   2021-09-15 10:04:01
1  xiaoming   active    177    2021-09-15 09:00:01   2021-09-15 10:04:01
~~~



以上的情况需要综合考虑，根据实际的需要进行取舍，上面的分析也就是提醒自己在以后主要到该种表的设计时，做分析的时候需要注意这几种情况。

