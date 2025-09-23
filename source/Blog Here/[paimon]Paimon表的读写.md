# [Paimon]Paimon表的读写

## 前言

本文着重记录和探讨在Flink/Spark读写paimon表时遇到的问题和一些写法概要，不讨论基础概念和对其他复杂问题进行研究。下文讨论的场景中，flink版本为1.18.1, Paimon的版本为0.8.2



## Flink与Paimon的集成

在我接触的环境中，flink主要用于写入paimon表，或者将paimon表作为流存储来实时消费

### 读取/写入Paimon表

#### 通过catalog方式

如官网所说的，可以通过创建catalog的形式进行读取

~~~sql
CREATE CATALOG my_catalog WITH (
    'type' = 'paimon',
    'warehouse' = 'hdfs:///path/to/warehouse'
);

USE CATALOG my_catalog;
~~~

如果使用oss存储，那么`warehouse`对应的就是`oss:///path/to/warehouse`

接下来，就是直接写一些查询SQL对Paimon表进行读取和上层分析了

#### 通过Connector方式

还可以通过使用通用Connector形式进行读取Paimon表，

~~~sql
CREATE TEMPORARY TABLE source_paimon_table
(
    id    BIGINT COMMENT '试驾ID',
    status STRING COMMENT '状态',
    event_time       BIGINT COMMENT '事件时间',
    create_time      BIGINT COMMENT '创建时间',
    update_time      BIGINT COMMENT '更新时间',
    dt               STRING COMMENT '分区日期',
    ts AS TO_TIMESTAMP_LTZ(event_time, 3),
    WATERMARK FOR ts AS ts - INTERVAL '60' SECOND,
    PRIMARY KEY (test_drive_id,status,dt) NOT ENFORCED
)
COMMENT '事件数据'
PARTITIONED BY (dt)
WITH (
       'connector' = 'paimon',
       'warehouse' = 'oss://endpoint/paimon/',
       'path' = 'oss://endpoint/paimon/your_database.db/your_table_name',
       'table.local-time-zone' = 'Asia/Shanghai',
       'scan.watermark.idle-timeout'='5min'
     )
~~~

同样，接下来就是编写常用SQL对Paimon表进行查询分析

#### NOTE

- 通过以上两种方式，都支持对paimon表进行实时消费(读取)，也支持实时写入

- 值得注意的是，在面的例子中，dt为分区字段，表的主键字段是id和status。在临时表创建声明中，需要同时指定id、status和dt为主键，即`PRIMARY KEY (test_drive_id,status,dt) NOT ENFORCED`
- 如果想要创建物理表，则在建表中不需要声明`TEMPORARY`, 如果想要仅仅对表进行连接而不想创建物理表，则需要声明`TEMPORARY`，这样就仅在会话中生效，会话关闭连接自动消失



## Spark与Paimon的集成

在我所接触的环境中，Spark主要用于对paimon表进行读取分析

### 时间旅行

如果需要对一个paimon表进行时间旅行查询，官网介绍，有以下几种方式：

~~~sql
-- read the snapshot with id 1L (use snapshot id as version)
SELECT * FROM t VERSION AS OF 1;

-- read the snapshot from specified timestamp 
SELECT * FROM t TIMESTAMP AS OF '2023-06-01 00:00:00.123';

-- read the snapshot from specified timestamp in unix seconds
SELECT * FROM t TIMESTAMP AS OF 1678883047;

-- read tag 'my-tag'
SELECT * FROM t VERSION AS OF 'my-tag';

-- read the snapshot from specified watermark. will match the first snapshot after the watermark
SELECT * FROM t VERSION AS OF 'watermark-1678883047356';

~~~

如果没有试错经验，上面的例子其实会产生误解，就是不知道`VERSION AS OF 1`该写在哪里，可能会理解为，写在where过滤条件后，其实不是。

以下是一个具体例子：

~~~sql
SELECT vin,
       id,
       info,
       calc_mode,
       date_format(from_unixtime((create_time)/ 1000), 'yyyy-MM-dd HH:mm:ss') AS create_time,
       date_format(from_unixtime((update_time)/ 1000), 'yyyy-MM-dd HH:mm:ss') AS update_time,
       dt
  FROM paimon_catalog.paimon_database.paimon_table
  TIMESTAMP AS OF '2025-09-22 14:16:48'
  -- VERSION AS OF 16000
WHERE dt='2025-09-20'
AND test_drive_id=1969284160278945792
-- and vin='LSVN0000000000000001'
;
~~~

**时间旅行声明需要紧随表名之后**，其他地方与普通SQL没有差别

