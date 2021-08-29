# [debezium]在启动任务时传入SQL语句生成Snapshot

## 前情概要

**当启动一个debezium的MySQL Connector时，debezium会默认对所有行的数据做一份snapshot，然后将该份数据发送到Kafka(如果下游是Kafka)中，而对于后面发生的数据库的插入、更新和删除操作时，才会使用binlog做监听，将数据发送到Kafka中。**

## 一个问题

现在有这样一个实际问题，如果我们使用debezium的MySQL Connector去监听一个或者多个数据量非常大的表(数据量在两千万左右)，由于某些特殊情况，Connector挂了或者丢失数据了、或者下游Kafka节点挂了丢失数据了、又或者Kafka的下游比如Flink挂了超时重启之后Kafka数据自动清除了，等等原因，需要从debezium端重新同步数据。

问题就是，由于debezium connector也是有瓶颈的，速率大概在600到1000条每秒(每秒从MySQL拉取600到1000条数据发送至下游，根据经验的粗略估计，没有仔细去压力测试过)，源表的数据量巨大，这样的同步非常耗时，大概需要六个小时左右的时间，这并不是我们想要的，由于丢失数据仅仅在几个小时前或者几天之前，日增量的数据与整表数据相比微乎其微，并不需要去整个表重新同步一份数据，然后发送下游去补齐数据。

那么，**有没有一个方法去选择性的同步我们想要追齐的数据，将这些数据从Debezium MySQL Connector选择性的去拉取，然后发送到下游补齐数据呢？**



**答案是，有的！**



## 正片开始

在[debezium官网](debezium.io)上,[基础配置属性](https://debezium.io/documentation/reference/1.2/connectors/mysql.html#mysql-connector-configuration-properties_debezium)里面描述了一些常用的Connector链接参数，用于配置一个MySQL Connector去同步MySQL数据发送到下游系统，而在[高级配置属性里面](https://debezium.io/documentation/reference/1.2/connectors/mysql.html#advanced-mysql-connector-properties)有这样一个配置`snapshot.select.statement.overrides`，是这样的描述的

> Controls which rows from tables will be included in snapshot.
> This property contains a comma-separated list of fully-qualified tables *(DB_NAME.TABLE_NAME)*. Select statements for the individual tables are specified in further configuration properties, one for each table, identified by the id `snapshot.select.statement.overrides.[DB_NAME].[TABLE_NAME]`. The value of those properties is the SELECT statement to use when retrieving data from the specific table during snapshotting. *A possible use case for large append-only tables is setting a specific point where to start (resume) snapshotting, in case a previous snapshotting was interrupted.*
> **Note**: This setting has impact on snapshots only. Events captured from binlog are not affected by it at all.

大意是说，该参数控制了从表中哪些行数据将被包括在snapshot中。该参数仅仅会作用在snapshot上，从binlog中解析到的时间并不会被影响。该配置包含一个使用逗号分割的表的全名，如：`snapshot.select.statement.overrides.[DB_NAME].[TABLE_NAME]`,该参数的值为一个SELECT语句，在从特定的表里拉取数据做snapshot的时候会运行该SQL语句，一个可能的用处就是在一个特别大的追加数据的表中，当之前的一个snapshot被中断了而需要从一个特定的位置重新做snapshot。

(这我都能翻译好，我太牛逼了)

说多了好像没有踏实感，还是不会配置，下面展示一个实际的配置样例，看看实际是怎么配置的。

~~~json
{
    "connector.class":"io.debezium.connector.mysql.MySqlConnector",
    "snapshot.locking.mode":"none",
    "max.queue.size":"81290",
    "topic.creation.default.partitions":"1",
    "database.history.kafka.topic":"dbhistory.bdp_uat_v2_test",
    "transforms":"route",
    "selfConvert.selector":".*",
    "selfConvert.hoursoffset":"0",
    "include.schema.changes":"true",
    "transforms.route.type":"org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.route.regex":"(.*)\\.(.*)\\.(.*)",
    "decimal.handling.mode":"string",
    "topic.creation.default.replication.factor":"3",
    "converters":"selfConvert",
    "transforms.route.replacement":"bdp_$2_$3_test",
    "selfConvert.tszd":"28800000",
    "database.user":"user",
    "database.server.id":"120",
    "snapshot.select.statement.overrides":"mos_realtime_sync.tm_users",
    "database.history.kafka.bootstrap.servers":"10.122.44.113:9092,10.122.44.114:9092,10.122.44.115:9092",
    "database.server.name":"bdp_mos_realtime_sync_test",
    "selfConvert.tsts":"-46800000",
    "selfConvert.type":"com.csvw.spi.CustomerConvert",
    "database.port":"3306",
    "snapshot.select.statement.overrides.mos_realtime_sync.tm_users":"select * from mos_realtime_sync.tm_users where id > 2892777",
    "database.hostname":"id.address",
    "database.password":"password",
    "name":"dbz_realtime_sync",
    "database.history.store.only.monitored.tables.ddl":"true",
    "table.include.list":"realtime_sync.tm_users",
    "max.batch.size":"20480",
    "snapshot.mode":"initial"
}
~~~



上面有很多配置属性，我们在此只关注这两个，

- 一个是

  ~~~properties
  "snapshot.select.statement.overrides":"mos_realtime_sync.tm_users"
  ~~~

- 另一个是

  ~~~properties
  "snapshot.select.statement.overrides.mos_realtime_sync.tm_users":"select * from mos_realtime_sync.tm_users where id > 2892777"
  ~~~

第一个表示SELECT语句的名称，为对应的表使用SELECT语句，将会去使用哪个语句，由于配置了`"mos_realtime_sync.tm_users"`,那么debezium会去配置属性里面去找标签为`snapshot.select.statement.overrides.mos_realtime_sync.tm_users`的配置，使用里面的SQL语句，在从库名为`mos_realtime_sync`的表名为`tm_users`使用SQL语句`select * from mos_realtime_sync.tm_users where id > 2892777`去生成snapshot