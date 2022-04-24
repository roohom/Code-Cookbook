# [Confluent]Confluent快速上手

## MySQL PXC Cluster

~~~shell
#启停主节点node1，第一个以bootstrap方式启动的为主节点
systemctl start mysql@bootstrap
systemctl stop mysql@bootstrap

#启停从节点node2，应在主节点之后启动
systemctl start mysql
systemctl stop mysql

#启停从节点node3，应在主节点之后启动
systemctl start mysql
systemctl stop mysql
~~~

- 如果忘记安全停掉服务而直接关闭机器，下次重启会报错

  - 解决：

  - 进入MySQL的目录

    ~~~shell
    cd /var/lib/mysql
    ~~~

  - 将`safe_to_bootstrap`设置为1

    ~~~shell
    [root@node1 mysql]# vim grastate.dat 
    # GALERA saved state
    version: 2.1
    uuid:    8b431131-4f3a-11eb-88f3-970395fb2768
    seqno:   9
    safe_to_bootstrap: 1
    ~~~

  - 其他节点同上(如果启动不了)

- 集群MySQL Master已开启binlog

## Confluent

> 当初Kafka创始团队里的三个成员单独出来创业所写的项目，构建与Kafka之上，也是一个流处理平台

- 启动步骤：
  - 启动zookeeper集群
  - 启动MySQL集群（后面使用Debezium需要开启MySQL）
  - 启动kafka集群

- 启动连接

  ~~~shell
  cd /export/servers/confluent-5.5.1
  nohup bin/connect-distributed ./etc/kafka/connect-distributed.properties &
  ~~~

**在此使用Conluent的Kafka Connector组件**

### Debezium

> *Debezium is an open source distributed platform for change data capture. Start it up, point it at your databases, and your apps can start responding to all of the inserts, updates, and deletes that other apps commit to your databases. Debezium is durable and fast, so your apps can respond quickly and never miss an event, even when things go wrong.*

> Debezium是一个开源的分布式的捕获变化数据平台。启动它，将其指向您的数据库，您的应用程序可以开始响应其他应用程序提交给数据库的所有插入，更新和删除操作。Debezium持久且快速，因此即使出现问题，您的应用程序也可以快速响应，并且不会错过任何事件。

> 说白了类似于Canal

![debezium-architecture](Commands.assets/debezium-architecture.png)

本质上是伪装成MySQL的Slave，监听binlog



- 默认情况下，Debezium将监听到的源数据库的数据变化同步到表名称相对应的Kafka topic中，对应的topic名称是`database.server.name`.`database_name`.`table_name`

- 如果在MySQL中的DDL操作，则所有的DDL操作都被同步到Kafka的一个由参数`database.history.kafka.topic`所指定的topic中
- 更多的详细配置参数可以在官网[获得](https://debezium.io/documentation/reference/1.2/connectors/mysql.html#add-mysql-connector-configuration-to-kafka-connect)

#### 基本操作

##### 如何提交一个任务？

- 本地创建一个json文件，命名为`test.json`

  ~~~json
  {
          "name": "create_table_sync_test", 
          "config": {
           "connector.class": "io.debezium.connector.mysql.MySqlConnector", 
           "database.hostname": "192.168.88.161", 
           "database.port": "3306", 
           "database.user": "root", 
           "database.password": "123456", 
           "database.server.id": "2", 
           "database.server.name": "local_test", 
           "table.whitelist": "uni.uni_table,uni.uni_table2",
           "snapshot.mode": "initial",
           "snapshot.locking.mode": "none",
           "database.history.kafka.bootstrap.servers": "192.168.88.161:9092,192.168.88.162:9092,192.168.88.163:9092", 
           "database.history.kafka.topic": "dbhistory.ddl_history", 
           "include.schema.changes": "true"
           }
  }
  ~~~

  - 完整版，本次测试不使用

    ~~~json
    {
            "name": "pxc_flink_kudu_test_new", 
            "config": {
            "connector.class": "io.debezium.connector.mysql.MySqlConnector", 
            "database.hostname": "192.168.88.161", 
            "database.port": "3306", 
            "database.user": "root", 
            "database.password": "123456", 
            "database.server.id": "5", 
            "database.server.name": "pxc_cluster", 
            "database.history.store.only.monitored.tables.ddl":"true",
            "table.whitelist": "unit.unit_test,unit_test2",
            "snapshot.mode": "initial",
            "snapshot.locking.mode": "none",
            "max.queue.size":"81290",
            "max.batch.size":"20480",
            "database.history.kafka.bootstrap.servers": "192.168.88.161:9092,192.168.88.162:9092,192.168.88.163:9092", 
            "database.history.kafka.topic": "dbhistory.ddl_his_topic", 
            "include.schema.changes": "true",
            "transforms":"route",
            "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
            "transforms.route.regex":"(.*)\\.(.*)\\.(.*)",
            "transforms.route.replacement":"local_test.$2.$3"
            }
    }
    ~~~

- 切换进入刚才所编写的`test.json`所存放的目录

  ~~~shell
  cd /export/datas
  ~~~

- 使用crul命令来提交，注意@后面的名称为文件的名称

  ~~~shell
  curl -s -X POST -H 'Content-Type: application/json' --data @test.json http://localhost:8083/connectors
  ~~~

  成功会返回：

  ~~~json
  {
      "name":"create_table_sync_test",
      "config":{
          "connector.class":"io.debezium.connector.mysql.MySqlConnector",
          "database.hostname":"192.168.88.161",
          "database.port":"3306",
          "database.user":"root",
          "database.password":"123456",
          "database.server.id":"2",
          "database.server.name":"local_test",
          "table.whitelist":"uni.uni_table,uni.uni_table2",
          "snapshot.mode":"initial",
          "snapshot.locking.mode":"none",
          "database.history.kafka.bootstrap.servers":"192.168.88.161:9092,192.168.88.162:9092,192.168.88.162:9092",
          "database.history.kafka.topic":"dbhistory.ddl_history",
          "include.schema.changes":"true",
          "name":"create_table_sync_test"
      },
      "tasks":[
  
      ],
      "type":"source"
  }
  ~~~

- 使用crul来查看是否提交成功

  ~~~shell
  curl http://localhost:8083/connectors
  ~~~

  会返回类似于如下的信息即表明成功：

  ~~~json
  ["create_table_sync_test","dbz_connect_test","test","dbz_connect_test_4","dbz_connect_test_2"]
  ~~~

- 接下来操作MySQL数据库，进行DDL操作，进行CURD操作，此时Kafka会自动创建新的topic，消费刚刚多出来的topic，里面的数据格式为json格式的数据，包含了你所做的所有操作(不包含SELECT，因为没意义)



##### 数据同步

- 注意`payload`里面的内容
  - c：插入
  - u：更新
  - d：删除

- 对MySQL中的表进行插入操作，消费kafka中的topic(`database.server.name`.`database_name`.`table_name`)中的数据

  ~~~json
  {
      "schema":{
          "type":"struct",
          "fields":[
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"name"
                      }
                  ],
                  "optional":true,
                  "name":"local_test.uni.uni_table2.Value",
                  "field":"before"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"name"
                      }
                  ],
                  "optional":true,
                  "name":"local_test.uni.uni_table2.Value",
                  "field":"after"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"string",
                          "optional":false,
                          "field":"version"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"connector"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"name"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"ts_ms"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "name":"io.debezium.data.Enum",
                          "version":1,
                          "parameters":{
                              "allowed":"true,last,false"
                          },
                          "default":"false",
                          "field":"snapshot"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"db"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"table"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"server_id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"gtid"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"file"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"pos"
                      },
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"row"
                      },
                      {
                          "type":"int64",
                          "optional":true,
                          "field":"thread"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"query"
                      }
                  ],
                  "optional":false,
                  "name":"io.debezium.connector.mysql.Source",
                  "field":"source"
              },
              {
                  "type":"string",
                  "optional":false,
                  "field":"op"
              },
              {
                  "type":"int64",
                  "optional":true,
                  "field":"ts_ms"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"string",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"total_order"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"data_collection_order"
                      }
                  ],
                  "optional":true,
                  "field":"transaction"
              }
          ],
          "optional":false,
          "name":"local_test.uni.uni_table2.Envelope"
      },
      "payload":{
          "before":null,
          "after":{
              "id":2,
              "name":"age"
          },
          "source":{
              "version":"1.2.5.Final",
              "connector":"mysql",
              "name":"local_test",
              "ts_ms":1610010822000,
              "snapshot":"false",
              "db":"uni",
              "table":"uni_table2",
              "server_id":1,
              "gtid":null,
              "file":"mysql_bin.000002",
              "pos":4257,
              "row":0,
              "thread":24,
              "query":null
          },
          "op":"c",
          "ts_ms":1610010822566,
          "transaction":null
      }
  }
  ~~~

- 更新操作update

  ~~~json
  {
      "schema":{
          "type":"struct",
          "fields":[
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"name"
                      }
                  ],
                  "optional":true,
                  "name":"local_test.uni.uni_table2.Value",
                  "field":"before"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"name"
                      }
                  ],
                  "optional":true,
                  "name":"local_test.uni.uni_table2.Value",
                  "field":"after"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"string",
                          "optional":false,
                          "field":"version"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"connector"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"name"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"ts_ms"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "name":"io.debezium.data.Enum",
                          "version":1,
                          "parameters":{
                              "allowed":"true,last,false"
                          },
                          "default":"false",
                          "field":"snapshot"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"db"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"table"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"server_id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"gtid"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"file"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"pos"
                      },
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"row"
                      },
                      {
                          "type":"int64",
                          "optional":true,
                          "field":"thread"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"query"
                      }
                  ],
                  "optional":false,
                  "name":"io.debezium.connector.mysql.Source",
                  "field":"source"
              },
              {
                  "type":"string",
                  "optional":false,
                  "field":"op"
              },
              {
                  "type":"int64",
                  "optional":true,
                  "field":"ts_ms"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"string",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"total_order"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"data_collection_order"
                      }
                  ],
                  "optional":true,
                  "field":"transaction"
              }
          ],
          "optional":false,
          "name":"local_test.uni.uni_table2.Envelope"
      },
      "payload":{
          "before":{
              "id":2,
              "name":"age"
          },
          "after":{
              "id":2,
              "name":"high"
          },
          "source":{
              "version":"1.2.5.Final",
              "connector":"mysql",
              "name":"local_test",
              "ts_ms":1610011059000,
              "snapshot":"false",
              "db":"uni",
              "table":"uni_table2",
              "server_id":1,
              "gtid":null,
              "file":"mysql_bin.000002",
              "pos":4528,
              "row":0,
              "thread":24,
              "query":null
          },
          "op":"u",
          "ts_ms":1610011059616,
          "transaction":null
      }
  }
  ~~~

- 删除操作delete

  ~~~json
  {
      "schema":{
          "type":"struct",
          "fields":[
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"name"
                      }
                  ],
                  "optional":true,
                  "name":"local_test.uni.uni_table2.Value",
                  "field":"before"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"name"
                      }
                  ],
                  "optional":true,
                  "name":"local_test.uni.uni_table2.Value",
                  "field":"after"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"string",
                          "optional":false,
                          "field":"version"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"connector"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"name"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"ts_ms"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "name":"io.debezium.data.Enum",
                          "version":1,
                          "parameters":{
                              "allowed":"true,last,false"
                          },
                          "default":"false",
                          "field":"snapshot"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"db"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"table"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"server_id"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"gtid"
                      },
                      {
                          "type":"string",
                          "optional":false,
                          "field":"file"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"pos"
                      },
                      {
                          "type":"int32",
                          "optional":false,
                          "field":"row"
                      },
                      {
                          "type":"int64",
                          "optional":true,
                          "field":"thread"
                      },
                      {
                          "type":"string",
                          "optional":true,
                          "field":"query"
                      }
                  ],
                  "optional":false,
                  "name":"io.debezium.connector.mysql.Source",
                  "field":"source"
              },
              {
                  "type":"string",
                  "optional":false,
                  "field":"op"
              },
              {
                  "type":"int64",
                  "optional":true,
                  "field":"ts_ms"
              },
              {
                  "type":"struct",
                  "fields":[
                      {
                          "type":"string",
                          "optional":false,
                          "field":"id"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"total_order"
                      },
                      {
                          "type":"int64",
                          "optional":false,
                          "field":"data_collection_order"
                      }
                  ],
                  "optional":true,
                  "field":"transaction"
              }
          ],
          "optional":false,
          "name":"local_test.uni.uni_table2.Envelope"
      },
      "payload":{
          "before":{
              "id":2,
              "name":"high"
          },
          "after":null,
          "source":{
              "version":"1.2.5.Final",
              "connector":"mysql",
              "name":"local_test",
              "ts_ms":1610011376000,
              "snapshot":"false",
              "db":"uni",
              "table":"uni_table2",
              "server_id":1,
              "gtid":null,
              "file":"mysql_bin.000002",
              "pos":4810,
              "row":0,
              "thread":24,
              "query":null
          },
          "op":"d",
          "ts_ms":1610011376846,
          "transaction":null
      }
  }
  ~~~

##### REST API控制

- `curl -s <Kafka Connect Worker URL>:8083/ `
  获取 Connect Worker 信息
- `curl -s <Kafka Connect Worker URL>:8083/connector-plugins `
  列出 Connect Worker 上所有 Connector
- `curl -s <Kafka Connect Worker URL>:8083/connectors/<Connector名字>/tasks `
  获取 Connector 上 Task 以及相关配置的信息
- `curl -s <Kafka Connect Worker URL>:8083/connectors/<Connector名字>/status `
  获取 Connector 状态信息
- `curl -s <Kafka Connect Worker URL>:8083/connectors/<Connector名字>/config `
  获取 Connector 配置信息
- `curl -s -X PUT <Kafka Connect Worker URL>:8083/connectors/<Connector名字>/pause`
  暂停 Connector
- `curl -s -X PUT <Kafka Connect Worker URL>:8083/connectors/<Connector名字>/resume`
  重启 Connector
- `curl -s -X DELETE <Kafka Connect Worker URL>:8083/connectors/<Connector名字>`
  删除 Connector

- 举个栗子：

  ~~~shell
  # 提交一个任务
  curl -s -X POST -H 'Content-Type: application/json' --data @curd_one_topic_test.json http://localhost:8083/connectors
  ~~~

  















