# [Flink]Flink Sources

> 本文在下面记录了一些常用的Flink读取常见的数据源的方法，虽然在官网已经有详细的说明文档了，但是只看文档还是不行的，还得实际操练起来，毕竟代码只有写多了才会用，遇到的bug越多，经验也就越多。

先说明，Flink官网已经明确表示，DatasetAPI将在今后的版本中被删除，目前为软删除状态，强烈建议大家使用TableAndSQL API 或者DataStreamAPI批模式

> Starting with Flink 1.12 the DataSet API has been soft deprecated.
>
> We recommend that you use the [Table API and SQL](https://ci.apache.org/projects/flink/flink-docs-release-1.13/docs/dev/table/overview/) to run efficient batch pipelines in a fully unified API. Table API is well integrated with common batch connectors and catalogs.
>
> Alternatively, you can also use the DataStream API with `BATCH` [execution mode](https://ci.apache.org/projects/flink/flink-docs-release-1.13/docs/dev/datastream/execution_mode/). The linked section also outlines cases where it makes sense to use the DataSet API but those cases will become rarer as development progresses and the DataSet API will eventually be removed. Please also see [FLIP-131](https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=158866741) for background information on this decision.

## Hive

如今，Hive仍然是数据仓库构建的主要工具（这话说得好别扭），就是说，只要是在做数仓，你一定会接触到Hive，那么使用Flink读取或者写入到Hive就显得很有必要。

### Read From Hive

虽然使用HiveCatalog连接到Hive不需要规划器，但是读写Hive都需要使用BlinkPlanner

> Please note while HiveCatalog doesn’t require a particular planner, reading/writing Hive tables only works with blink planner. Therefore it’s highly recommended that you use blink planner when connecting to your Hive warehouse.

以下为读写Hive的一个实例：读支持了流的模式也支持批的模式，以下使用了流的模式，读可以，但是写不太好使，如果想写，可以使用批模式，在下面有说。

> Note:本地运行，所以需要在resources目录下放置集群的四个`site.xml`

~~~java
public class HiveSource {
    private static final String HIVE_CATALOG = "default";

    public static void main(String[] args) {
        //定义流处理环境
        StreamExecutionEnvironment streamEnv = StreamExecutionEnvironment.getExecutionEnvironment();
        EnvironmentSettings streamSetting = EnvironmentSettings.newInstance().useBlinkPlanner().inStreamingMode().build();
        StreamTableEnvironment tEnv = StreamTableEnvironment.create(streamEnv, streamSetting);

        HiveCatalog hive = new HiveCatalog(HIVE_CATALOG, "test", "lib/conf");
        tEnv.registerCatalog(HIVE_CATALOG, hive);
        tEnv.useCatalog(HIVE_CATALOG);
        tEnv.useDatabase("test");
        tEnv.executeSql("SHOW DATABASES").print();
        
        tEnv.executeSql("SELECT * FROM ods_user").print();
    }
}
~~~

结果：

~~~sql
+---------------+
| database name |
+---------------+
|       default |
|   dw_unicdata |
|          test |
|      unicdata |
+---------------+
4 rows in set
+-------------+--------------------------------+--------------------------------+
|          id |                           name |                             dt |
+-------------+--------------------------------+--------------------------------+
|           1 |                         长大强 |                     2021-07-24 |
|           2 |                         孙大壮 |                     2021-07-24 |
+-------------+--------------------------------+--------------------------------+
2 rows in set
~~~

### Write To Hive

#### 批模式(Batch Mode)

和读的方式类似，写入，以下使用**批模式**

~~~java
public class HiveSource {
    private static final String HIVE_CATALOG = "default";

    public static void main(String[] args) {
        //定义流处理环境
//        ExecutionEnvironment streamEnv = ExecutionEnvironment.getExecutionEnvironment();
        EnvironmentSettings streamSetting = EnvironmentSettings.newInstance().useBlinkPlanner().inBatchMode().build();
        TableEnvironment tEnv = TableEnvironment.create(streamSetting);

        HiveCatalog hive = new HiveCatalog(HIVE_CATALOG, "test", "lib/conf");
        tEnv.registerCatalog(HIVE_CATALOG, hive);
        tEnv.useCatalog(HIVE_CATALOG);
        tEnv.useDatabase("test");
        tEnv.executeSql("SHOW DATABASES").print();

        tEnv.executeSql("SELECT * FROM ods_user").print();
        tEnv.executeSql("INSERT INTO test.ods_user PARTITION(dt='2021-08-19') SELECT id, name FROM test.ods_user").print();
        tEnv.executeSql("SELECT * FROM ods_user").print();
    }
}
~~~

结果：

~~~sql
+-----------------------+
| default.test.ods_user |
+-----------------------+
|                    -1 |
+-----------------------+
1 row in set
+-------------+--------------------------------+--------------------------------+
|          id |                           name |                             dt |
+-------------+--------------------------------+--------------------------------+
|           1 |                         长大强 |                     2021-08-19 |
|           2 |                         孙大壮 |                     2021-08-19 |
|           2 |                         孙大壮 |                     2021-08-19 |
|           1 |                         长大强 |                     2021-07-24 |
|           2 |                         孙大壮 |                     2021-07-24 |
|           1 |                         长大强 |                     2021-08-19 |
|           2 |                         孙大壮 |                     2021-08-19 |
|           1 |                         长大强 |                     2021-08-19 |
+-------------+--------------------------------+--------------------------------+
8 rows in set
~~~

#### 流表模式(Streaming Mode)

~~~java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
//CHECKPOINT
env.enableCheckpointing(6000);
env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
env.getCheckpointConfig().setCheckpointTimeout(3000);
env.getCheckpointConfig().setTolerableCheckpointFailureNumber(3);
//RESTART STRATEGY
env.setRestartStrategy(RestartStrategies.fixedDelayRestart(2,
      Time.of(1000, TimeUnit.SECONDS)));

DataStreamSource<String> streamSource = env.readTextFile("a text file to generate source records");
EnvironmentSettings streamSetting = EnvironmentSettings.newInstance().useBlinkPlanner().inStreamingMode().build();
StreamTableEnvironment streamTableEnv = StreamTableEnvironment.create(env, streamSetting);
//设置hive catalog
HiveCatalog hive = new HiveCatalog(flinkSinkHiveProperties.getCatalog(),
        "a database to use",
        "hive conf dir(在cdh上一般为/etc/hive/conf)"
);
streamTableEnv.registerCatalog("catalog名(自定义)", hive);
streamTableEnv.useCatalog("catalog名(自定义)");
streamTableEnv.useDatabase("数据库名，自己指定");
streamTableEnv.getConfig().getConfiguration().setString("table.exec.hive.fallback-mapred-reader", "true");

//--------------------------------------------------------------------------------------------------------
//  执行hive语句
//--------------------------------------------------------------------------------------------------------
//1、可以使用 StatementSet ，往StatementSet中添加语句然后批量执行，
StatementSet hiveStatementSet = streamTableEnv.createStatementSet();
hiveStatementSet.addInsertSql(sql);
hiveStatementSet.execute();

//2、也可以使用
streamTableEnv.executeSql("select ...");
//3、最后一定得用如下来执行整个任务，否则会报没有触发算子无法生成流图
env.execute();

~~~

> 说明，如果你只想使用了流表，并且都是使用SQL进行操作，那么你可以使用1的方式进行操作，而不需要使用2和3。但是，如果将流和表混合使用，在触发任务执行的时候，将1、2、3结合使用仍然会抛出异常，这时候你得抛弃1的使用方法，而将2和3结合使用(使用Flink1.12版本进行测试)

#### 一个问题：Hive怎么没数据？

- 1、当你使用以上代码去往Hive写数据时，经过一番操作，发现任务跑起来了，并且没有抛异常(抛了也被你解决了)，一切执行成功，非常nice，可是你去查询hive的时候却发现，表里却没有数据，这时候再去hdfs上文件目录里也是有文件的，并且可以看到`inprogress`
  - 解决办法：检查代码是否设置了checkpoint，如果设置了再检查程序是否checkpoint成功。Flink只有在checkpoint成功时才会将hive的分区信息commit并且输出的小文件由inprogress状态切换位success
- 2、当发现1的问题后成功设置了checkpoint，但还是发现hive中没有数据
  - 这个时候当程序成功运行完之后，需要去Hive上修复目标表，修复表的元数据，即`MSCK REPAIR TABLE xxx.xxx`

## Kafka

### Read From Kafka

#### 使用DataStream API

以下使用了SimpleStringSchema去反序列化kafka中的消息，如果遇到了flink提供的反序列化类不足以支撑实现你的业务功能时，需要自定义反序列化Schema，可以参考[前面文章](https://code-cookbook.readthedocs.io/zh_CN/main/Blog%20Here/%5BFlink%5D%E8%87%AA%E5%AE%9A%E4%B9%89%E5%BA%8F%E5%88%97%E5%8C%96%E6%B6%88%E8%B4%B9Kafka%E6%95%B0%E6%8D%AE.html),描述了一个自定义Schema去反序列化Kafka中的存储着的序列化的对象的消息

~~~java
@SneakyThrows
@Test
public void QueryKafka() {
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

    Properties properties = new Properties();
    properties.setProperty("bootstrap.servers", "cdh001:9092,cdh002:9092,cdh003:9092");
    properties.setProperty("group.id", "test");
    DataStream<String> stream = env.addSource(
            new FlinkKafkaConsumer<>("mos-uat-vds-charging_settings_snapshot-vcf_originated",
                    new SimpleStringSchema(), properties)
            .setStartFromEarliest()
    );
    stream.map(new MapFunction<String, String>() {
        @Override
        public String map(String value) throws Exception {
            return value;
        }
    }).print();

    env.execute("Kafka Source");
}
~~~

### Sink to kafka

> 以下来自于flink官网(版本1.12)

~~~java
DataStream<String> stream = ...

Properties properties = new Properties();
properties.setProperty("bootstrap.servers", "localhost:9092");

FlinkKafkaProducer<String> myProducer = new FlinkKafkaProducer<>(
        "my-topic",                  // target topic
        new SimpleStringSchema(),    // serialization schema
        properties,                  // producer config
        FlinkKafkaProducer.Semantic.EXACTLY_ONCE); // fault-tolerance

stream.addSink(myProducer);
~~~
