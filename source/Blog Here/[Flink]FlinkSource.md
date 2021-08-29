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

和读的方式类似，写入

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



## Kafka

### Read From Kafka

#### 使用DataStream API

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

