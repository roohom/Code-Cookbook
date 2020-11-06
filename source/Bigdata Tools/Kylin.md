# Kylin

## 概述

- 是一个OLAP数据分析平台（新版本支持实时模块）。

- 优点：

  - 可以基于海量数据进行OLAP分析

  - 亚秒级交互式查询（查询性能好）

  - CUBE数据预聚合 （以空间换时间）

    > 以存储空间换取查询性能的提升，减少查询消耗的时间

    - Kylin拉取Hive中的历史数据，进行cube构建

    - cube会根据维度进行指标聚合

      > Cube负载加载Hive数据，通过维度字段对指标字段进行预聚合，聚合好之后将结果数据存储在Hbase

    - cube构建好之后会将结果数据保存在Hbase

      > 结果数据指的是：聚合好的指标数据
  >
      > 维度越多，在构建的时候越耗性能
    
    - web查询数据是通过Kylin的查询服务，直接查询Hbase的数据

## 启动

- 启动zookeeper

- 启动HDFS

- 启动YARN集群

- 启动HBASE

- 启动Hive

  - 启动MetaStore

    ~~~shell
    cd $HIVE_HOME/bin
    hive --service metastore &
    ~~~

  - 启动hivesever2

    ~~~shell
    cd $HIVE_HOME/bin
    hive --service hiveserver2 &
    ~~~

- 启动Yarn HistoryServer

  ~~~shell
  mr-jobhistory-daemon.sh start historyserver
  ~~~

- 启动Kylin

  ~~~shell
  cd $KYLIN_HOME/bin
  ./kylin.sh start
  ~~~

- 页面访问地址：

  ~~~
  http://node01:7070
  ~~~

  > 用户名:ADMIN
  >
  > 密码:KYLIN

## 使用

- 使用Kylin构建Cube
  - 1、首先数据必须先存在于Hive
  - 2、加载Hive中的数据
  - 3、创建Model，需要指定表，指定维度、指定聚合指标
  - 4、创建Cube，需要指定model名称，指定维度、指定聚合指标、指定构建引擎
  - 5、构建Cube
  - 6、数据查询

## 工作原理

- Cube：多维立方体，是一个形象的说法，cube模型称为多维立方体模型，由Cuboid组成
- Cuboid：立方形，也是一个形象说法，对任意一组维度进行组合（维度的数量可以是0,1，或者更多），得到的聚合结果，被称为cuboid。cuboid的数量取决于维度的数量，总数量=2^(维度的个数)次方