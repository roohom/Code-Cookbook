# [debezium]热修改Debezium MySQL Connector配置

> 此操作针对debezium1.2，更高版本应该也支持。

假设这样一个场景：现在已经针对数据库中的表创建了connector的，并且设置的是表级别的白名单，而且一个库使用一个connector，如果后期该库中新增了一个之前没有的表，我们仍然想对其进行监听，重新创建一个connector似乎代价过大，该如何做？

针对此场景，解决办法是热修改connector的配置，现默认服务已经全部启动，connector已经成功注册

#### 第一步

> 原来的connector不需要进行DELETE、PAUSE、RESTART等一切操作

找准需要热修改的connector，编辑对应于该connector的配置文件，只针对config参数，在`table.whitelist`里面新增需要新同步的表

> 该配置编辑成文件，命名为`mos-uos_debezium_connector2.json `

~~~json
{
    "connector.class": "io.debezium.connector.mysql.MySqlConnector",
    "database.hostname": "192.168.88.161",
    "database.port": "3306",
    "database.user": "root",
    "database.password": "123456",
    "database.server.id": "7",
    "database.server.name": "cdp.mos-uos",
    "database.history.store.only.monitored.tables.ddl":"true",
    "table.whitelist": "mos-uos.uos,mos-uos.tos,mos-uos.pos",
    "snapshot.mode": "when_needed",
    "snapshot.locking.mode": "none",
    "max.queue.size":"81290",
    "max.batch.size":"20480",
    "decimal.handling.mode":"string",
    "database.history.kafka.bootstrap.servers": "192.168.88.161:9092,192.168.88.162:9092,192.168.88.163:9092",
    "database.history.kafka.topic": "dbhistory.localddl",
    "include.schema.changes": "true",
    "transforms":"route",
    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
    "transforms.route.regex":"(.*)\\.(.*)\\.(.*)",
    "transforms.route.replacement":"cdp.$2.$3",
    "converters":"selfConvert",
    "selfConvert.type":"com.test.mos.debezium.UserDefineConvert",
    "selfConvert.selector":".*"
  
}
~~~

#### 第二步

使用命令行提交，注意命令中指定了`connector的名字`和`config`

~~~shell
curl -s -X PUT -H 'Content-Type: application/json' --data @mos-uos_debezium_connector2.json http://localhost:8083/connectors/dbz_mos-uos/config
~~~

