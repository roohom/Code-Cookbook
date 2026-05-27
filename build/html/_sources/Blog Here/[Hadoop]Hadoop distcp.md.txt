# [Hadoop]Hadoop distcp

> DistCp（分布式拷贝）是用于大规模集群内部和集群之间拷贝的工具。 它使用Map/Reduce实现文件分发，错误处理和恢复，以及报告生成。 它把文件和目录的列表作为map任务的输入，每个任务会完成源列表中部分文件的拷贝。 由于使用了Map/Reduce方法，这个工具在语义和执行上都会有特殊的地方。

当两个集群之间安全认证相互隔离，但是却可以相互ping通，就比如两个数据湖相互隔离。需要从一个集群从目标集群访问数据时，在集群上使用spark直接读取，会报如下错误：

> Server  asks us to fall back to SIMPLE auth, but this client  is configured to only allow secure connections.

此时，hadoop distcp就起到了作用，它专门用于集群之间的文件的拷贝，并且是分布式的。



实际用到的一个命令为：

~~~shell
hadoop distcp -D ipc.client.fallback-to-simple-auth-allowed=true -m 5 -bandwidth 69 hdfs://nn1:8020/foo/bar hdfs://nn2:8020/bar/foo
~~~



来看看Hadoop 官网介绍的一条简单命令：

~~~shell
hadoop distcp hdfs://nn1:8020/foo/bar hdfs://nn2:8020/bar/foo
~~~

这条命令会把nn1集群的/foo/bar目录下的所有文件或目录名展开并存储到一个临时文件中，这些文件内容的拷贝工作被分配给多个map任务， 然后每个TaskTracker分别执行从nn1到nn2的拷贝操作。注意DistCp使用绝对路径进行操作。



详细操作见官网：[传送门](http://hadoop.apache.org/docs/r1.0.4/cn/distcp.html)



> 今天是中国共产党成立100周年之日，1921-2021
>
> 人民有信仰
>
> 民族有希望
>
> 国家有力量
>
> 我应该好好学习，敲出更好的代码