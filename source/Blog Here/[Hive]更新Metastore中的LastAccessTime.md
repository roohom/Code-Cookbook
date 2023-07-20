# [Hive]更新Metastore中的LastAccessTime

## 背景

有一个需求：我们的数据仓库中随着业务的扩展和迭代，衍生出了大量的表(Hive表)，其中包含着一些已经废弃或者很久都没有使用的表，这些给存储带来了很大的压力，现在需要区分出冷热表，将冷表数据清除或者进行压缩。问题来了，那么如何进行区分这些表是冷还是热呢？



## 分析

在Hive的metastore中存储了一张Hive表的所有元数据信息，包含了表的大小，分区数，分区数据条数等等，其中有一个重要的元数据信息: `lastAccessTime`，类似如下（虽然是0），这个信息表示这张表最近一次的访问时间，包含了数据的写入、读，可以以此来判断数据的冷热，如果一张表的最近访问时间较早，或许长达一年没有被访问或者更新，那么它很可能就是一张待废弃的表。

~~~json
{
	"data": {
		"dbName": "temp",
		"tableName": "json_test",
		"comment": null,
		"totalSize": 26,
		"createTime": 1653617586,
		"lastAccessTime": 0,
		"lastModifiedTime": null,
		"partitionKeys": [],
		"inputFormat": "org.apache.hadoop.mapred.TextInputFormat",
		"outputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
		"location": "hdfs://nameservice1/user/hive/warehouse/temp.db/json_test",
		"isCompress": false,
		"numRows": 1,
		"table_type": "EXTERNAL_TABLE",
		"numFiles": 1,
		"owner": "xxx",
		"sd": {
			"cols": [
				{
					"name": "id",
					"type": "string",
					"comment": null,
					"setType": true,
					"setComment": false,
					"setName": true
				},
				{
					"name": "name",
					"type": "string",
					"comment": null,
					"setType": true,
					"setComment": false,
					"setName": true
				}
			],
			"location": "hdfs://nameservice1/user/hive/warehouse/temp.db/json_test",
			"inputFormat": "org.apache.hadoop.mapred.TextInputFormat",
			"outputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
			"compressed": false,
			"numBuckets": -1,
			"serdeInfo": {
				"name": null,
				"serializationLib": "org.apache.hadoop.hive.serde2.JsonSerDe",
				"parameters": {
					"serialization.format": "1"
				},
				"setSerializationLib": true,
				"setName": false,
				"setParameters": true,
				"parametersSize": 1
			},
			"bucketCols": [],
			"sortCols": [],
			"parameters": {},
			"skewedInfo": {
				"skewedColNames": [],
				"skewedColValues": [],
				"skewedColValueLocationMaps": {},
				"setSkewedColNames": true,
				"setSkewedColValues": true,
				"setSkewedColValueLocationMaps": true,
				"skewedColNamesSize": 0,
				"skewedColNamesIterator": [],
				"skewedColValuesSize": 0,
				"skewedColValuesIterator": [],
				"skewedColValueLocationMapsSize": 0
			},
			"storedAsSubDirectories": false,
			"colsSize": 2,
			"colsIterator": [
				{
					"name": "id",
					"type": "string",
					"comment": null,
					"setType": true,
					"setComment": false,
					"setName": true
				},
				{
					"name": "name",
					"type": "string",
					"comment": null,
					"setType": true,
					"setComment": false,
					"setName": true
				}
			],
			"setCompressed": true,
			"setNumBuckets": true,
			"bucketColsSize": 0,
			"bucketColsIterator": [],
			"sortColsSize": 0,
			"sortColsIterator": [],
			"setStoredAsSubDirectories": true,
			"setLocation": true,
			"setInputFormat": true,
			"setOutputFormat": true,
			"setSerdeInfo": true,
			"setBucketCols": true,
			"setSortCols": true,
			"setSkewedInfo": true,
			"setParameters": true,
			"parametersSize": 0,
			"setCols": true
		},
		"retention": 0,
		"parameters": {
			"external.table.purge": "TRUE",
			"totalSize": "26",
			"numRows": "1",
			"rawDataSize": "0",
			"EXTERNAL": "TRUE",
			"COLUMN_STATS_ACCURATE": "{\"BASIC_STATS\":\"true\",\"COLUMN_STATS\":{\"id\":\"true\",\"name\":\"true\"}}",
			"numFiles": "1",
			"transient_lastDdlTime": "1653617619",
			"TRANSLATED_TO_EXTERNAL": "TRUE",
			"bucketing_version": "2",
			"numFilesErasureCoded": "0"
		},
		"view_original_text": "{\"dbName\":\"temp\",\"tableName\":\"json_test\",\"viewOriginalText\":null}",
		"view_expanded_text": "{\"dbName\":\"temp\",\"tableName\":\"json_test\",\"viewExpandedText\":null}",
		"privileges": null,
		"temporary": false
	},
	"code": 200,
	"errmsg": "success"
}
~~~



## 探索实现

### Hive hook

Hive提供了一个hook(钩子方法)用来扩展需要执行的功能函数，可以在运行前、中、后执行一定的自定义功能。默认提供了一个`hive.exec.pre.hooks`的参数，用来执行运行前的动作。如果想要在每次执行Hive查询或者INSERT前制定其为`org.apache.hadoop.hive.ql.hooks.UpdateInputAccessTimeHook$PreExec`则可以更新metastore中的lastAccessTime

如何开启呢？

1、hive-site.xml的 Hive 服务高级配置代码段（安全阀）中添加2个参数

~~~properties
hive.security.authorization.sqlstd.confwhitelist=hive.exec.pre.hooks
hive.exec.pre.hooks=org.apache.hadoop.hive.ql.hooks.UpdateInputAccessTimeHook$PreExec
~~~

2、重启Hive即可

~~~xml
<property>
	<name>hive.security.authorization.sqlstd.confwhitelist</name>
	<value>hive.exec.pre.hooks</value>
</property>

<property>
	<name>hive.exec.pre.hooks</name>
	<value>org.apache.hadoop.hive.ql.hooks.UpdateInputAccessTimeHook$PreExec</value>
</property>
~~~

当然上述是全局的，如果想要会话级别的也可以在每次运行HiveSQL前执行

~~~sql
set hive.exec.pre.hooks=org.apache.hadoop.hive.ql.hooks.UpdateInputAccessTimeHook$PreExec
~~~



### Atlas API

CDP中集成了Atlas，Atlas提供了丰富的血缘和元数据管理，当查询引擎加工表的时候，都会被记录，但是我发现，Atlas上收集到的Hive的lastAccessTime仅仅是表的创建时间，这对上面的需求就显得无能为力了。

### Spark

以上的配置，仅仅针对Hive生效，如果想要用别的执行引擎就无效了，那么Spark支持吗？

答案是不支持！(无奈)

可以参考这条[JIRA](https://issues.apache.org/jira/browse/SPARK-18879)



#### 一种思考

如果想要实现同样的功能，只能外挂了。自定一个解析SQL的类似hook的函数，每次运行要执行的SparkSQL的时候，解析这个sql，拿到FROM的表名和需要INSERT的表名，更新他们在metastore里面的lastAccessTime。

~~~mermaid
graph LR

CustomSparkHook --调用API更新--> HiveMetastore
~~~

这种方式可行，但是有缺点:

- 不是全局的，需要自定义代码，无法集成到Spark内部，使用者需要关心代码的部署，而不能只关心自己的SQL和业务逻辑
- 如果类似于Zeppelin这样的交互式的查询分析工具，很不方便集成。