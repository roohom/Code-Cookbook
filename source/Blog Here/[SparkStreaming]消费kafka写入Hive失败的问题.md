# [SparkStreaming]消费kafka写入Hive失败的问题[Lease timeout of 0 seconds expired](https://stackoverflow.com/questions/39855384/spark-streaming-java-io-ioexception-lease-timeout-of-0-seconds-expired)



## 问题来源



在集群提交了一个Spark Streaming应用程序用来消费Kafka的数据并将数据插入到Hive表中，程序提交的前几天运行正常，但当运行了几天之后通过查看WebUI发现程序并没有output出数据落入Hive表，查看日志发现有如下错误抛出：

~~~java
22/04/06 16:40:04 ERROR scheduler.AsyncEventQueue: Listener EventLoggingListener threw an exception
java.io.IOException: Lease timeout of 0 seconds expired.
	at org.apache.hadoop.hdfs.DFSOutputStream.abort(DFSOutputStream.java:795)
	at org.apache.hadoop.hdfs.DFSClient.closeAllFilesBeingWritten(DFSClient.java:606)
	at org.apache.hadoop.hdfs.DFSClient.renewLease(DFSClient.java:574)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer.renew(LeaseRenewer.java:395)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer.run(LeaseRenewer.java:415)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer.access$600(LeaseRenewer.java:76)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer$1.run(LeaseRenewer.java:307)
	at java.lang.Thread.run(Thread.java:748)
22/04/06 16:40:04 INFO common.FileUtils: Creating directory if it doesn't exist: hdfs://nameservice1/user/hive/warehouse/dw_csvw.db/ods_kafka_mbb_rts_trip_data/.hive-staging_hive_2022-04-06_16-40-04_089_5948812028170174027-1
22/04/06 16:40:04 WARN ipc.Client: Exception encountered while connecting to the server : org.apache.hadoop.ipc.RemoteException(org.apache.hadoop.security.token.SecretManager$InvalidToken): token (token for scb: HDFS_DELEGATION_TOKEN owner=xxx@XXXX.COM, renewer=yarn, realUser=, issueDate=1648462512020, maxDate=1649067312020, sequenceNumber=5614554, masterKeyId=972) can't be found in cache
22/04/06 16:40:04 ERROR scheduler.AsyncEventQueue: Listener EventLoggingListener threw an exception
java.io.IOException: Lease timeout of 0 seconds expired.
	at org.apache.hadoop.hdfs.DFSOutputStream.abort(DFSOutputStream.java:795)
	at org.apache.hadoop.hdfs.DFSClient.closeAllFilesBeingWritten(DFSClient.java:606)
	at org.apache.hadoop.hdfs.DFSClient.renewLease(DFSClient.java:574)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer.renew(LeaseRenewer.java:395)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer.run(LeaseRenewer.java:415)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer.access$600(LeaseRenewer.java:76)
	at org.apache.hadoop.hdfs.client.impl.LeaseRenewer$1.run(LeaseRenewer.java:307)
	at java.lang.Thread.run(Thread.java:748)
~~~



## 尝试解决



当看到`token (token for scb: HDFS_DELEGATION_TOKEN owner=scb@CSVW.COM, renewer=yarn, realUser=, issueDate=1648462512020, maxDate=1649067312020, sequenceNumber=5614554, masterKeyId=972) can't be found in cache`的时候，我就猜到这个问题肯定和Kerberos有些许关系，分析日志，猜测是由于spark成功消费了kafka，但是在写入Hive表的时候，由于Kerberos票据过期，无法成功在HDFS创建文件。

于是我向百度求助，在垃圾堆里翻了又翻，没找到合适的解决办法，于是我在stackoverflow上发现了[一篇文章](https://stackoverflow.com/questions/39855384/spark-streaming-java-io-ioexception-lease-timeout-of-0-seconds-expired)，在下面的链接中找到了[另一片文章](http://mkuthan.github.io/blog/2016/09/30/spark-streaming-on-yarn/),发现了一个解决办法，下面将于晚问内容引用出来：

> On a secured HDFS cluster, long-running Spark Streaming jobs fail due to Kerberos ticket expiration. Without additional settings, Kerberos ticket is issued when Spark Streaming job is submitted to the cluster. When the ticket expires Spark Streaming job is not able to write or read data from HDFS anymore.
>
> In theory (based on documentation) it should be enough to pass Kerberos principal and keytab as spark-submit command:
>
> ~~~shell
> spark-submit --master yarn --deploy-mode cluster \
>      --conf spark.yarn.maxAppAttempts=4 \
>      --conf spark.yarn.am.attemptFailuresValidityInterval=1h \
>      --conf spark.yarn.max.executor.failures={8 * num_executors} \
>      --conf spark.yarn.executor.failuresValidityInterval=1h \
>      --conf spark.task.maxFailures=8 \
>      --queue realtime_queue \
>      --conf spark.speculation=true \
>      --principal user/hostname@domain \
>      --keytab /path/to/foo.keytab
> ~~~
>
> In practice, due to several bugs ([HDFS-9276](https://issues.apache.org/jira/browse/HDFS-9276), [SPARK-11182](https://issues.apache.org/jira/browse/SPARK-11182)) HDFS cache must be disabled. If not, Spark will not be able to read updated token from file on HDFS.
>
> ~~~shell
> spark-submit --master yarn --deploy-mode cluster \
>      --conf spark.yarn.maxAppAttempts=4 \
>      --conf spark.yarn.am.attemptFailuresValidityInterval=1h \
>      --conf spark.yarn.max.executor.failures={8 * num_executors} \
>      --conf spark.yarn.executor.failuresValidityInterval=1h \
>      --conf spark.task.maxFailures=8 \
>      --queue realtime_queue \
>      --conf spark.speculation=true \
>      --principal user/hostname@domain \
>      --keytab /path/to/foo.keytab \
>      --conf spark.hadoop.fs.hdfs.impl.disable.cache=true
> ~~~
>
> Mark Grover pointed out that those bugs only affect HDFS clusters configured with NameNodes in [HA mode](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/ResourceManagerHA.html). Thanks, Mark.

在上面的内容中提到了一个重要的参数

~~~shell
--conf spark.hadoop.fs.hdfs.impl.disable.cache=true
~~~



意思就是说 

*在实践中，由于一些BUG（[HDFS-9276](https://issues.apache.org/jira/browse/HDFS-9276)、[SPARK-11182](https://issues.apache.org/jira/browse/SPARK-11182)）必须禁用 HDFS 缓存。否则，Spark 将无法从 HDFS 上的文件中读取更新的令牌。*



该方法还没尝试过，但觉得应该有效，但是有没有别的副作用暂且不知道，仅仅记录于此，当再次遇到类似问题的时候能有个思路。