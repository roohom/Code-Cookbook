# Commands

## Zookeeper

~~~shell
cd /export/servers/zookeeper-3.4.6/bin/
start-zk-all.sh 
~~~

## Hadoop

| 机器名 | HDFS服务           | YARN服务                    |
| ------ | ------------------ | --------------------------- |
| node1  | NameNode，DataNode | NodeManager                 |
| node2  | DataNode           | NodeManager                 |
| node3  | DataNode           | ResouceManager，NodeManager |



~~~shell
#启停HDFS
start-dfs.sh
stop-dfs.sh
#启停yarn
start-yarn.sh
stop-yarn.sh
~~~

Hadoop3较Hadoop2在默认端口上发生了变动，注意配置文件里的配置，这里为了习惯设置成hadoop2的

~~~properties
# cd /export/servers/hadoop-3.0.0/etc/hadoop/

# core-site.xml
<property>
	<name>fs.defaultFS</name>
	<value>hdfs://node1:9000/</value>
</property>

# hdfs-site.xml
<property>
	<name>dfs.namenode.secondary.http-address</name>
	<value>node1:50090</value>
</property>
<property>
	<name>dfs.namenode.http-address</name>
	<value>node1:50070</value>
</property>

# yarn-site.xml 
# resourcemanager在node3上
<property>
	<name>yarn.resourcemanager.hostname</name>
	<value>node3</value>
</property>
~~~



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

## Kafka

~~~shell
#启停Kafka 在每台机器上
#启动
cd /export/servers/kafka_2.11-2.1.1
bin/kafka-server-start.sh config/server.properties >>/dev/null 2>&1 &
#停止
bin/kafka-server-stop.sh
~~~

- 命令

  - 消费

    ~~~shell
    kafka-console-consumer.sh --topic unicdata_dev.test.test1 --bootstrap-server node1:9092,node2:9092,node3:9092 --from-beginning
    ~~~

  - 列出

    ~~~shell
    kafka-topics.sh --list --zookeeper node1:2181,node2:2181,node3:2181
    ~~~

    



## Flink

node1位master，node1、node2、node3为workers

~~~shell
cd /export/servers/flink-1.10.2/
#启动Flink集群
bin/start-cluster.sh 
#关闭Flink集群
bin/stop-cluster.sh 
~~~

## Confluent

> 当初Kafka创始团队里的三个成员单独出来创业所写的项目，构建与Kafka之上，也是一个流处理平台

- 启动步骤：
  - 启动zookeeper集群
  - 启动MySQL集群（后面使用Debezium需要开启MySQL）
  - 启动kafka集群

- 启动连接

  ~~~shell
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
           "database.history.kafka.bootstrap.servers": "192.168.88.161:9092,192.168.88.162:9092,192.168.88.162:9092", 
           "database.history.kafka.topic": "dbhistory.ddl_history", 
           "include.schema.changes": "true"
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

- 接下来操作MySQL数据库，进行DDL操作，进行CURD操作，此时Kafka会自动创建新的topic，消费刚刚多出来的topic，里面的数据格式为json格式的数据，包含了你所做的所有操作(不包含SELECT，因为没意义)



















