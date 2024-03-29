# [Hadoop]一些Hadoop问题

### 1.Hadoop中Split和Block的区别？([看这篇博客](https://www.jianshu.com/p/3e3758519777))

- Block

  - 文件上传到HDFS时会被分块(Block)，是真实的物理块的划分。默认块大小是128MB

  - 分布式存储系统中选择大的Block size主要是为了**最小化寻址开销**，使得磁盘传输数据的时间可以明显大于定于这个块所需要的时间。

    > 在磁盘中，每个磁盘都有默认的数据块大小，这是磁盘进行数据读/写的最小单位，磁盘块一般为**512字节**。但是在分布式文件系统中数据块一般远大于磁盘数据块的大小，并且为磁盘块大小的整数倍，例如HDFS Block size默认为64MB。
    >
    > 在HDFS中Block size也不好设置的过大，这是因为MapReduce中的map任务通常一次处理一个块中的数据，因此如果Block太大，则map数就会减少，作业运行的并行度就会受到影响，速度就会较慢。
    >
    > 当上传到HDFS上的文件大小小于Block size时，会按文件实际大小存储。

- Split

  - Split是逻辑意义上的切分，文件并没有真正意义上在物理层面被切分。
  - Split size允许用户自定义，默认为HDFS的Block Size
  - 在Input阶段，MapReduce会根据输入文件计算输入分片，每个split就对应一个Map

- 总结：

  - Block是物理上的分割，而Split是逻辑上的切割
  - 一个split可以包含多个block，一个block也可应用多个split，这取决于用户自定义的split size
  - 一个split对应于一个map

### 2.Hive中如何处理小文件？

- 产生原因：

  - 数据源本来就包含大量的小文件
  - Reduce数量越多，小文件也越多
  - 动态分区插入数据，产生大量的小文件，从而导致map数量剧增

- 影响：

  - 1.从Hive的角度看，小文件会开很多map，一个map开一个JVM去执行，所以这些任务的初始化，启动，执行会浪费大量的资源，严重影响性能。
  - 2.在HDFS中，每个小文件对象约占150byte，如果小文件过多会占用大量内存。这样NameNode内存容量严重制约了集群的扩展。

- 解决：

  - 1.使用hadoop archive命令把小文件进行归档。

  - 2.重建表，建表时减少reduce数量。

  - 3.通过参数进行调节，设置map/reduce端的相关参数

    - 设置map输入合并小文件

      ~~~
      //每个Map最大输入大小(这个值决定了合并后文件的数量)
      set mapred.max.split.size=256000000;
      //一个节点上split的至少的大小(这个值决定了多个DataNode上的文件是否需要合并)
      set mapred.min.split.size.per.node=100000000;
      //一个交换机下split的至少的大小(这个值决定了多个交换机上的文件是否需要合并)
      set mapred.min.split.size.per.rack=100000000;
      //执行Map前进行小文件合并
      set hive.input.format=org.apache.hadoop.hive.ql.io.CombineHiveInputFormat;
      ~~~

    - 设置map输出和reduce输出合并文件

      ~~~
      //设置map端输出进行合并，默认为true
      set hive.merge.mapfiles = true
      //设置reduce端输出进行合并，默认为false
      set hive.merge.mapredfiles = true
      //设置合并文件的大小
      set hive.merge.size.per.task = 256*1000*1000
      //当输出文件的平均大小小于该值时，启动一个独立的MapReduce任务进行文件merge。
      set hive.merge.smallfiles.avgsize=16000000
      ~~~

### 3.推测执行机制？

- 背景：
  - MapReduce模型将作业分解成任务然后并行执行任务以使得整体运行时间少于各个任务顺序执行的时间
  - 当一个作业(Job)由几百或者几千个任务组成时，可能出现少数“拖后腿”的任务，这些任务的执行时间过长
    - 原因有很多种，检测却很难，任务总能完成但是就是比预期的时间要长
- 解决：
  - Hadoop不会去尝试或者诊断修复执行慢的任务，相反在一个任务运行比预期慢的时候，会尽量检测，并启动另一个相同的任务作为备份，这就是所谓的“**推测执行**”
  - 如果同时执行两个重复的任务，会相互金正，导致推测执行无法执行，这对集群资源是一种浪费。调度器时刻跟踪作业中所有相同类型的任务的进度，并且仅仅启动运行速度明显低于平均水平的那一小部分的推测副本，一个任务完成以后，任何正在执行的重复任务都将被中止
  - **如果原任务在推测执行前完成，推测任务就被终止；如果推测任务先完成，原任务就被终止**



### 4.Hadoop为什么要自己实现序列化，而不用Java自带的序列化？（为什么不用Java Object Serialization？）

- Java有自己的序列化机制，成为Java Object Serialization，该机制与编程语言紧密相关。

- Hadoop之父Doug Cutting是这样说的：“为什么开始设计Hadoop的时候不用Java Serialization？因为它**(Java Serialization)看起来太复杂，而我认为需要一个至精至简的机制，可以用于精确控制对象的读和写，这个机制将是Hadoop的核心**，使用Java Serialization虽然可以获得一些控制权，但用起来非常纠结。不用RMI(Remote Mwthod Invocation 远程方法调用)也处于类似的考虑。**高效、高性能的进程间通信是Hadoop的关键**。我觉得我们需要精确控制连接、延迟和缓冲的处理方式，RWI对此也无能为力。”

- 问题在于Java Serialization不满足Hadoop序列化格式标准：精简、快速、可扩展、支持互操作

  > 简而言之，Java自带的序列化太过于笨重，不能实现Hadoop中所要求的高效、高性能的进程间通信和精确控制对象的读和写。

### 5.yarn的三种调度策略?

- FIFO Scheduler 
- Capacity Scheduler
- FairScheduler

### 6.blocksize是根据什么设置?

### 7.分布式缓存?

### 8.blocksize是根据什么设置?

### 9.hive支持lock吗?

1.hive锁表命令

1. `hive> lock table t1 exclusive;锁表后不能对表进行操作`

2.hive表解锁：

1. `hive> unlock table t1;`

3.查看被锁的表

　　1.hive> show locks;

### 10.为什么HDFS的Block不能设置太大也不能设置太小？

- 如果块设置过大

  - 一方面，从磁盘传输数据的时间会明显大于寻址时间，导致程序在处理这块数据时，变得非常慢；

  - 另一方面，mapreduce中的map任务通常一次只处理一个块中的数据，如果块过大运行速度也会很慢。

- 如果块设置过小
  -  一方面存放大量小文件会占用NameNode中大量内存来存储元数据，而NameNode的内存是有限的，不可取；
  - 另一方面文件块过小，寻址时间增大，导致程序一直在找block的开始位置。

- 因而，块适当设置大一些，减少寻址时间，那么传输一个由多个块组成的文件的时间***\*主要取决于磁盘的传输速率\****。

### 11.HDFS中块（block）的大小为什么设置为128M？

> 答案来自：[点我看博客原文](https://blog.csdn.net/wx1528159409/article/details/84260023)

1. HDFS中平均寻址时间大概为10ms；

2. 经过前人的大量测试发现，寻址时间为传输时间的1%时，为最佳状态；

  所以最佳传输时间为10ms/0.01=1000ms=1s

3. 目前磁盘的传输速率普遍为100MB/s；

  计算出最佳block大小：100MB/s x 1s = 100MB

  所以我们设定block大小为128MB。



### 12.Hive严格模式和非严格模式的区别？

> Hive提供了一个严格模式，可以防止用户执行那些可能产生意想不到的不好的效果的查询。即某些查询在严格
> 模式下无法执行。通过设置hive.mapred.mode的值为strict，可以禁止3中类型的查询。

- 带有分区的表的查询
  - 如果在一个分区表执行hive，除非where语句中包含分区字段过滤条件来显示数据范围，否则不允许执行。换句话说，就是**不允许用户扫描所有的分区**。进行这个限制的原因是，通常分区表都拥有非常大的数据集，而且数据增加迅速。如果没有进行分区限制的查询可能会消耗令人不可接受的巨大资源来处理这个表
- 带有orderby的查询
  - 对于使用了orderby的查询，要求必须有limit语句。因为**order by为了执行排序过程会讲所有的结果分发到同一个reducer中进行处理**，强烈要求用户增加这个limit语句可以防止reducer额外执行很长一段时间
- 限制笛卡尔积的查询
  - 对关系型数据库非常了解的用户可能期望在执行join查询的时候不使用on语句而是使用where语句，这样关系数据库的执行优化器就可以高效的将where语句转换成那个on语句。不幸的是，hive不会执行这种优化，因此，如果表足够大，那么这个查询就会出现不可控的情况
- 总结：
  - **1.对分区表进行查询，必须使用where+分区字段来限制范围。**
  - **2.使用orderby查询的时候，必须加上limit限制，因为执行order by的时候，已经将所有的数据放到了一个reduce中了。**
  - **3.限制笛卡尔积的查询，因为在关系型数据库中，可以使用where充当on，但是在hive数据仓库中，必须使用on。**

> 非严格模式则没有上述限制



### 13.JVM的重用机制

- JVM重用是Hadoop调优参数的内容，其对Hive的性能具有非常大的影响，特别是对于很难避免**小文件**的场景或**task特别多的场景**，这类场景大多数执行时间都很短。

- Hadoop的默认配置通常是使用派生JVM来执行map和Reduce任务的。这时JVM的启动过程可能会造成相当大的开销，尤其是执行的job包含有成百上千task任务的情况。**JVM重用可以使得JVM实例在同一个job中重新使用N次**。N的值可以在Hadoop的mapred-site.xml文件中进行配置。通常在10-20之间，具体多少需要根据具体业务场景测试得出。

  ~~~xml
  <property>
    <name>mapreduce.job.jvm.numtasks</name>
    <value>10</value>
    <description>How many tasks to run per jvm. If set to -1, there is no limit. </description>
  </property>
  ~~~

- 缺点：

  - 开启JVM重用将一直占用使用到的task插槽，以便进行重用，直到任务完成后才能释放。如果某个“不平衡的”job中有某几个reduce task执行的时间要比其他Reduce task消耗的时间多的多的话，那么保留的插槽就会一直空闲着却无法被其他的job使用，直到所有的task都结束了才会释放。

### 14.Hive文件存储格式及他们的类型(基于行还是列)？

> 博文参考 [hive中parquet和SEQUENCEFILE区别](https://www.cnblogs.com/sunpengblog/p/11912958.html)

- Hive中的存储格式
  - TEXTFILE
    - 默认格式
  - SQUENCEFILE
  - RCFILE
  - ORCFILE
  - PARQUET
- 分类
  - 基于行存储
    - TEXTFILE
    - SQUENCEFILE
      - 存储为二进制
    - RCFILE
      - 行列混合
  - 基于列式存储
    - ORC
    - PARQUET

### 15.分区与分桶的区别？

- 分区针对的是数据，分桶针对的是文件，不同分区就是不同的目录。

- 分桶针对的是文件，一个桶对应的就是一个文件
  - 分桶规则，按照某列的值的Hash取余桶的个数
  - 本质：低层就是MapReduce的分区（多个reduce的情况下）



### 16.Yarn的产生是为了解决什么问题？

在Hadoop 1.x中负责资源调度的是JobTracker，当存在多个计算框架时，每个框架都有自己的资源调度工具，这就会引起资源争抢，造成故障，在Hadoop 2.x中引入了Yarn，负责**提供统一的资源服务**。

### 17.Hive中order by、sort by、distribute by和cluster by的区别和联系？

- order by
  - 全局排序
  - 在严格模式下使用order by必须使用LIMIT
- sort by
  - 单独在各自的reduce中排序，不能保证全局有序
  - 一般和distribute by一起使用，并且书写在distribute by之后
  - 当reduce个数为1(mapred.reduce.tasks=1)效果个order by一样，当reduce为多个时，，每个reduce输出一个文件，文件内部有序，但不能全局有序
- distribute by
  - 控制Map输出的结果被怎样划分进入Reducer
  - 相同Key的值进入同一个Reducer
- cluster by
  - 相当远distribute by  ... sort by...相结合使用
  - 只能升序排序

