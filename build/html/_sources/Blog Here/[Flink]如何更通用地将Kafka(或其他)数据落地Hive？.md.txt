# [Flink]如何更通用地将Kafka(或其他)数据落地Hive？

> 项目上经常遇到一些将Kafka数据落地Hive的需求，Spark可以通过SparkStreaming解决，但当下更流行的方式应该属Flink了，为了更好地学习Flink，特地归类总结了一些将Kafka数据或者其他数据源的数据落入Hive的代码，提炼一些主要的思路，并将一些核心代码整理在这里，方便后面自己回忆，在进行重复开发的时候可以开箱即用(Ctrl-C, Ctrl-V)。

## 简述

大多数的数据源一般都是类似于Kafka这样的及时消息队列，下游可以是消息队列或者是离线存储系统(比如Hive、HDFS)，也或许是MySQL之类的数据库。

<u>有很简单的FlinkSQL可以使用，在这里不做讨论，以下讨论较为灵活的低阶API(DataStream API)，并且以Flink消费Kafka数据落入Hive为例，基于Flink1.12.1版本。</u>

大致流程都是：

- 1、SOURCE，消费Kafka的数据
- 2、TRANSFORM，转换，实现自己的业务逻辑
- 3、SINK，将数据落到下游存储系统

废话少说，直接放码。

## 开整

### SOURCE

代码实现使用了Flink去消费Kafka，得到一个`DataStream<Object>`

~~~java
Properties properties = new Properties();
FlinkKafkaConsumer flinkKafkaConsumer = new FlinkKafkaConsumer(
                "a_topic_to_consume",
                new SimpleStringShemma(),//一个合适的deserializer
                properties
        );
SingleOutputStreamOperator sourceStream = env.addSource(flinkKafkaConsumer);
~~~



### TRANSFORM

为了方便落入Hive表中，我们将前面得到的`DataStream<Object>`处理成`DataStream<Row>`，经过以下处理得到了一个名为`processedStream`的数据流，流中的数据类型为`Row`。但是该Row上没有被指定合适的类型，Flink并不知道怎么去处理这些类型，如果不加处理，程序会抛出异常提示我们去手动分配。

~~~java
SingleOutputStreamOperator<Row> processedStream = sourceStream.flatMap(
    new MbbVehFlatMapFunction(),
    TypeUtil.getTypeInformation(columnMap, columnList)
)
~~~

`columnMap`存储的是一个字段名和字段类型的映射关系，`columnList`存储的是字段名称，并且有序。

TypeUtil.getTypeInformation()内容如下:

~~~java
/**
     * 将row中的字段指定合适的类型
     *
     * @param columnMap  存储有字段名及对应的字段类型的map
     * @param columnList 存储字段名的list
     * @return
     */
public static TypeInformation<Row> getTypeInformation(Map<String, String> columnMap, List<String> columnList) {
    List<String> fieldNames = new ArrayList<>();
    List<TypeInformation<?>> types = new ArrayList<>();
    for (String column : columnList) {
        String type = columnMap.get(column);
        fieldNames.add(column);
        types.add(TypeInformation.of(typeCheck(type)));
    }
    return new RowTypeInfo(types.toArray(new TypeInformation<?>[0]), fieldNames.toArray(new String[0]));
}
~~~

以上方法的作用是，将一个Row中没个字段都指定合适的类型，并且该类型被应用在前面得到的processedStream上。

### SINK

在SINK部分，我们使用FlinkSQL去处理，首先将上面的到的Row流创建通过TableAPI创建一个临时表，再使用SQL将该临时表的数据`INSERT`到Hive表中。

```java
String tempViewName = x + "_stream_view";
streamTableEnv.createTemporaryView(tempViewName, processedStream);

//使用hive方言
streamTableEnv.getConfig().setSqlDialect(SqlDialect.HIVE);
//执行Hive建表语句
//some code here
streamTableEnv.executeSql("INSERT INTO TABLE xxx SELECT * FROM " + tempViewName); //也可能是动态分区插入数据，可以使用附录部分的util
```

​	

## 附录

### 获取流表执行环境

~~~java
public class FlinkSinkHiveProperties implements Serializable {
    private String catalog;

    private String database;

    private String confDir;

    private String tableName;

    private ArrayList<String> partition;

    /**
     * 分区处理规则 如：SUBSTRING(culumn_xxx, 1, 3)
     */
    private String partitionRule;

    //字段名列表
    private ArrayList<String> columnList;
}

/**
 * 获取流表执行环境
 *
 * @param env                     流环境
 * @param flinkSinkHiveProperties flink sink hive的配置
 * @return 流表执行环境
 */
public StreamTableEnvironment getStreamTableEnv(StreamExecutionEnvironment env, FlinkSinkHiveProperties flinkSinkHiveProperties) {
    EnvironmentSettings streamSetting = EnvironmentSettings.newInstance().useBlinkPlanner().inStreamingMode().build();
    StreamTableEnvironment streamTableEnv = StreamTableEnvironment.create(env, streamSetting);
    HiveCatalog hive = new HiveCatalog(
            flinkSinkHiveProperties.getCatalog(),
            flinkSinkHiveProperties.getDatabase(),
            flinkSinkHiveProperties.getConfDir()
    );
    streamTableEnv.registerCatalog(flinkSinkHiveProperties.getCatalog(), hive);
    streamTableEnv.useCatalog(flinkSinkHiveProperties.getCatalog());
    streamTableEnv.useDatabase(flinkSinkHiveProperties.getDatabase());
    return streamTableEnv;
}
~~~



### Hive建表

~~~java
/**
     * conn
     * 
     * param  tableEnv 表执行环境
     * @param table      注册table
     * @param columnList 字段列表
     * @param partition  分区字段名列表
     */
public void createTable(TableEnvironment tableEnv, String table, String columnList, ArrayList<String> partition) {
    String createSql = "\nCREATE EXTERNAL TABLE IF NOT EXISTS " + table + "(\n";
    createSql += columnList + ",etl_time TIMESTAMP)\n";
    //partition
    createSql += (partition == null || partition.size() == 0) ? "" : " PARTITIONED BY (" + partition.stream()
        .map(x -> "`" + x + "` STRING")
        .reduce((x, y) -> x + ", " + y)
        .orElse("") + ")\n";
    createSql += " STORED AS parquet \n" +
        " TBLPROPERTIES (\n" +
        "  'sink.rolling-policy.rollover-interval'='" + env.getProperty("flink.sink.hive.rolling-policy.rollover-interval") + "',\n" +
        "  'sink.partition-commit.trigger'='" + env.getProperty("flink.sink.hive.partition-commit.trigger") + "',\n" +
        "  'sink.partition-commit.delay'='" + env.getProperty("flink.sink.hive.partition-commit.delay") + "',\n" +
        "  'sink.partition-commit.policy.kind'='" + env.getProperty("flink.sink.hive.partition-commit.policy.kind") + "'\n" +
        ")";
    LOG.info("HiveUtil -> Create table sql is -> {}", createSql);
    tableEnv.executeSql(createSql);
~~~

以上实际的效果如：

~~~sql
CREATE EXTERNAL TABLE IF NOT EXISTS test_table
(
 `vin` STRING, 
 `factoryplatemodel` STRING, 
 `accbmodelname` STRING, 
 `accbtypecode` STRING, 
 `invoicekind` STRING, 
 `dealercode` STRING, 
 `dealername` STRING, 
 `salesorgname` STRING, 
 `invoicetypr` STRING, 
 `biztype` STRING, 
 `discountno` STRING, 
 `isvalid` STRING, 
 `invoicestatus` STRING, 
 `invoicedate` STRING, 
 `totaltaxamount` STRING, 
 `isdelivery` STRING, 
 `deliverydate` STRING, 
 `salestype` STRING,
 etl_time TIMESTAMP
)
 PARTITIONED BY (`dt` STRING)
 STORED AS parquet 
 TBLPROPERTIES (
  'sink.rolling-policy.rollover-interval'='1 min',
  'sink.partition-commit.trigger'='process-time',
  'sink.partition-commit.delay'='0s',
  'sink.partition-commit.policy.kind'='metastore,success-file'
)
~~~

### Hive插入数据

~~~java
/**
     * 生成动态插入分区的SQL语句
     *
     * @param table         表名
     * @param tempViewName  临时表名
     * @param columnList    字段列，以逗号分割，如: a,b,c
     * @param partition     分区字段
     * @param partitionRule 分区字段处理规则
     * @return insert语句
     */
public String insert(String table, String tempViewName, String columnList, ArrayList<String> partition, String partitionRule) {
    String insertSQL = "INSERT INTO TABLE " + table + " ";
    //PARTITION
    insertSQL += (partition == null || partition.size() == 0) ? "" : " PARTITION(" + partition.stream()
        .map(x -> "`" + x + "`")
        .reduce((x, y) -> x + ", " + y)
        .orElse("") + ")\n";
    //SELECT
    insertSQL += " SELECT " + columnList + ", NOW() AS etl_time, " + partitionRule;
    //PARTITION VALUE
    insertSQL += "\n FROM " + tempViewName;
    LOG.info("HiveUtil -> INSERT SQL IS -> {}", insertSQL);

    return insertSQL;
}
~~~

以上的实际效果如：

~~~sql
INSERT INTO TABLE test_table PARTITION(dt)
SELECT column_a,column_b,...,NOW() AS etl_time, SUBSTRING(column_b, 1,3)
FROM xxx_stream_view;
~~~

