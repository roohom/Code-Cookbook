[TOC]



# 数据仓库

## 概念

数据库与数据仓库都是事先数据存储的一种设计模型

## 功能

- 更加规范和统一化的数据管理平台
- 将企业需要的所有数据进行存储，提供给企业各个需要使用数据的部门进行应用

## 特点

- 专门用于设计存储数据的地方
- 本身不产生数据
- 本身不使用数据
- 面向主题：不同的应用给定不同的主题，用到不同的数据
  - 对数据按照需求分类

## 流程

- 数据生成
  - 业务数据：数据库
  - 用户行为数据：日志
  - 机器运行日志：日志
  - 爬虫数据
  - 第三方合作数据
- 数据采集：通过各种采集工具将不同类型的数据存储在数据仓库中
  - 先放入HDFS
- ETL：数据清洗
  - 过滤、转换、补全
  - 对HDFS上的原始数据进行处理，处理好的数据放入数仓
- 数据仓库：将各种各样的数据进行统一化的存储
  - 分层：规范所有数据进入数仓以后经过哪些步骤的处理，得到最后想要的结果
    - 原始数据：ETL
    - 第一层：存储ETL之后的数据
    - 第二层：对第一层之后的数据简单处理
    - 第三层：第二层之后的数据进行处理
    - 第四层：得到需求方需要的数据
- 构建数据仓库：
  - 离线数仓：Hive



# Hive

> 起源自：FaceBook

- Hive提供SQL的开发接口，用户可以直接使用SQL来操作Hadoop

- Hive本身只是一个翻译的角色，底层分布式存储和分布式计算都是靠Hadoop来实现的

- 高度依赖于Hadoop

## 本质

一种特殊的支持SQL开发接口的Hadoop客户端



## 功能

- **将文件映射成表的数据**[工作中主要使用此功能构建数仓]
  - Hive的存储：HDFS
- 功能二：将SQL语句转换为MapReduce程序，提交给yarn运行[工作中使用较少，替代品：Impala、SparkSQL
  - MapReduce是对文件进行操作
  - SQL是对表进行操作
  - Hive是对表处理的，底层的MapReduce是对文件进行处理的

## 应用场景

应用于构建**数据仓库**

## 架构

- 客户端：用于提供与用户交互的界面，实现SQL开发

- 服务端：

  - 负责分析SQL，读写元数据，提交程序给Hadoop
  - 连接器：负责维护与客户端的连接
  - 解析器：负责解析SQL语句构建语法树
    - 判断数据库、表是否存在
    - 语法是否正确
    - 最终得到一个逻辑计划
  - 优化器：优化这个逻辑，得到物理计划
  - 执行器：执行物理计划得到结果返回给客户端

- 元数据：存储Hive中关键性信息
  - Hive中所有数据库、所有表的信息
  - HDFS与Hive表的映射关系
  
- Hadoop：Hive所有的请求都是给Hadoop**实现**的
  - Hive自己不是分布式的
  - Hive能实现分布式存储和分布式计算
  - 底层：
    - 存储：HDFS
    - 计算：MapReduce+yarn

## 常用配置

- 本地模式

  ~~~shell
  set hive.exec.mode.local.auto=true;
  ~~~

  - 本地模式的三个条件：
    - 1.job的输入数据大小必须小于参数：hive.exec.mode.local.auto.inputbytes.max(默认128MB)
    - 2.job的map数必须小于参数：hive.exec.mode.local.auto.tasks.max(默认4)
    - 3.job的reduce数必须为0或者1

## 元数据服务

- 存储内容：**Hive中关键性数据，数据库、表、列的信息**
- 存储位置
  - 默认位置：derby数据库
    - Hive自带的文本型数据库，轻量级的数据库
    - 一般用于嵌入式系统中的数据存储
    - 不方便管理和维护，不方便共享
  - 自定义位置：MySQL 
    - 官方推荐使用的存储方式
    - 工作中使用的方式(**几乎所有的元数据都存放在MySQL**)
- 元数据的**访问**方式：**内嵌模式**、**本地模式**、**远程模式**
  - 内嵌模式：元数据使用默认存储，直接访问derby
  - 本地模式：元数据使用RDBMS(关系型数据库管理系统)：MySQL，Hive
    - RDBMS：关系型数据库管理系统
    - NoSQL：非关系型数据库
  - 远程模式：元数据存储是使用MySQL，Hive服务端访问Metastore服务来访问元数据 (metastroe相当于一个中介)

### 元数据共享

- **问**：使用Spark/Impala/presto等对Hive中的数据进行计算从而代替hive底层的MapReduce计算，如何能让Spark等工具读取到Hive中的表，以及对应的HDFS的数据呢？
  
  - **解决**：所有的数据都存储在元数据中，只要**将Hive元数据共享刚给其他工具即可**
  
  > 默认的，Hive服务端会将Hive客户端的操作请求翻译成MapReduce API并提交给Hadoop，实现对Hive中的数据进行计算，此时Hive仅仅充当一个翻译工具，目的是将用户指定SQL语言翻译成MapReduce代码，而MapReduce运行计算是非常慢的，这样的方式效率低下，而Spark等工具效率高速度快，可以使用spark等工具代替Hive底层的MapReduce实现计算。但是这样一来，spark等工具怎么知道Hive中的表在哪里已经对应的HDFS数据在哪里呢，为了解决此问题，我们知道Hive的元数据中存储了Hive中的关键性信息，如数据库、表、列的信息，只要将Hive中的元数据共享给其他工具即可。
  
- 问：如何实现共享问题？

  - 解决：**构建元数据管理服务MetaStore**，让所有需要访问JHive中表和对应的HDFS数据的工具直接访问MetaStore，MetaStore来告诉他们对应的数据在哪。

  > 如果让spark等其他计算工具直接访问Hive的元数据，会产生一系列权限问题，Hive的元数据是采用MySQL存储的，MySQL会对客户端的访问进行权限检查，使得访问不通过。但即使没有权限检查，其他工具直接访问Hive的元数据，也不清楚不知道访问到的元数据是干嘛的，有怎样的信息，为了解决此问题，Hive专门构建了MetaStore，让其他工具直接将**元数据读写请求**发送至MetaStore，MetaStore会解析客户端的请求，并告诉其需要访问的的数据在哪，以及数据的具体信息。



### 元数据管理服务

- MetaStore：为了实现元数据共享而涉及的一种专有的元数据管理服务

- 元数据管理服务的开启由配置决定，在hive-site.xml中：

  ~~~xml
  <property>
      <name>hive.metastore.uris</name>
      <value>thrift://node3:9083</value>
  </property>
  ~~~

  - 配置了这个服务，就必须先开启MetaStore这个服务再使用Hive

  > 由于所有对Hive元数据的读写请求都是经过MetaStore来处理的，所以必须开启MetaStore服务才能是Hive客户端访问Hive元数据。举个栗子：早期打电话，会有电话中转，张铁妞先将电话拨到服务台，告诉接线员我要打给王大锤，于是接线员就将线路接到了王大锤家，如果MetaStore没有先开启，张铁妞就不能直接拨打王大锤家的电话。

## 表的分类与结构

### 管理表

>  MANAGED_TABLE

- Hive中默认创建的表的类型
  - 特点：
    - 只要不手动删除，这张表就一直存在
    - 手动删除管理表：元数据会被删除，数据也会被删除

### 临时表

> TRMPORARY

- 特点：
  - 这张表创建的客户端一旦断开连接，临时表会自动删除
  - 一般用于存储临时数据，并且表用完以后不会再被使用

### 外部表

> EXTERNAL_TABLE

- 特点：

  - 手动删除外部表：元数据会被删除，但是数据不会被删除

    > 某个用户在读取该表之后将其删除，只是删除了元数据，数据仍然保留在HDFS上，多个人对同一份数据进行读取并建立了外部表，每个人使用完之后删除了自己的表，不影响最终保留在HDFS上的那份数据。

- 应用：

  - 如果这份数据比较重要，建立外部表保证数据安全
  - 入股多个人需要使用这张表读取同一份数据，任何一个表被删除，不能影响数据

### 结构

#### 普通结构表

- 普通结构表和HDFS文件之间的映射关系

  - Hive表的最后一级目录就是表的目录

  - 表中的数据按照原始数据文件形式存在

    > 当使用load data语句将文件与Hive中的表关联后，无论原先HDFS文件存储在HDFS上的哪个位置，都会被移送到/user/hive/warehouse/数据库名/表名这个目录下，并且仍然按照文件形式存储

#### 分区结构表

> 降低程序的负载，提高程序的效率

**设计思想**是**优化底层MapReduce的输入，根据分区直接对数据进行过滤，避免不需要用到的数据进入程序。**

> 将数据**按照目录拆分**，**不同分区就是不同的目录**，在这种情况下，**如果过滤条件不是分区字段，那么分区优化是无效的**

为什么这么说？

- 有个场景：

  - 在表的目录下(hivelog)存储了多个日志文件，并且每个日志文件以时间命名(如：2020-08-29)，如果需要对8月29日的日志文件进行处理，则需要过滤：

    ~~~SQL
    select count(*) from hivelog where daystr=2020-08-29;
    ~~~

    >  这么简单的依据SQL，我们知道Hive的底层是通过MapReduce来实现的，所以在底层MapReduce读取了HDFS上hivelog这个目录，将这个目录下的所有文件作为程序的输入，过滤的目的可以达到，可是这么一来，就需要读取所有的文件，而MapReduce运行起来好费时间和资源

- 另一个场景：

  - 同样在hivelog下存储了多个文件，不过与上个场景不同的是，每天日志文件都被上一级以时间命名的目录包裹起来，如：

    ~~~
    /user/hive/warehouse/practice.db/2020-08-28/2020-08-28.log
    /user/hive/warehouse/practice.db/2020-08-29/2020-08-29.log
    /user/hive/warehouse/practice.db/2020-08-30/2020-08-30.log
    ~~~

    > 这样，如果我们想要过滤读取到2020-08-29这一天的日志再次执行
    >
    > ~~~SQL
    > select count(*) from hivelog where daystr=2020-08-29;
    > ~~~
    >
    > 在底层MapReduce程序的输入是不一样的，它只读取了2020-08-29.log这个文件，文件读取量是上一种场景的三分之一

- 应用场景：
  
- 需要按照一定的时间维度进行数据处理，数据量非常大的
  
- 实现方式：

  - 方式一：**手动分区**(静态分区)

    - 应用场景：数据本身就是**已经按照分区规则分好**了的

      - 例如hive的日志就是按照天日期分好的

    - 这样就可以之间创建一张分区表，将对应的文件按照分区条件加载到不同对的分区中

      > 加载，这个时候，Hive实际在HDFS中数据表的目录下创建了N个以分区条件命名的目录

      ~~~SQL
      load data local inpath '/export/datas/emp10.txt' into table
      tb_emp_part1 partition(department = 10);
      
      此时目录名就是department=10
      ~~~

    - 例如

      ~~~sql
      insert overwrite table demo_static_partition 
      partition(year="2020", month="04", 
      day="2020-04-10", hour="22") 
      select user_id, user_name, 
      trade_year as year ,
      trade_month as month,
      trade_day as day,
      trade_hour as hour  
      from user_demo 
      where trade_year="2020" 
      and trade_month="04" 
      and trade_day="2020-04-10" 
      and trade_hour="22" 
      ~~~

      

    - 分区表的分区过滤，直接通过元数据找到分区对应的HDFS位置作为MapReduce的输入

  - 方式二：**自动分区**(动态分区)

    - 应用场景：**数据本身没有做分区**，拆分不同的文件

      - 例如：Nginx的日志每天都追加写入同一个文件中

    - 实现步骤：

      1. 开启自动分区

         ~~~SQL
         set hive.exec.dynamic.partition.mode=nonstrict;
         ~~~

      2. 创建一张分区表，将待分区的文件加载到这张普通表中

      3. 再创建一张分区结构表，使用partitioned by字段指定分区的字段条件

      4. 从普通表中查询将数据分区写入创建的分区结构表中

         ~~~SQL
         insert into table 分区表 partition(分区字段) select * from 普通表;
         ~~~
         
         ~~~sql
         insert overwrite table demo_dynamic_partition 
         partition(year=year, month=month, 
         day=day, hour=hour) 
         select user_id, user_name, 
         trade_year as year ,
         trade_month as month,
         trade_day as day,
         trade_hour as hour  
         from user_demo 
         ~~~
         
         
    
  - 使用动态分区与静态分区的注意事项和区别

    - 区别：

      - 动态分区，在运行时根据列的取值去自动创建分区，有多少种值就多少个分区，会为每个分区分配reduce个数，当分区量过多时，reduce也会增加
      - 静态分区不管分区有没有数据都会创建该分区，而动态分区则会有结果就创建，没结果就不会创建
      - 动态分区根据字段的变化而变化，手动分区是文件已经按照字段分区规则分好，手动指定分区的值为静态值。

    - 注意事项：

      - 需要开启属性配置：

        ~~~sql
        -- Hive默认配置值
        -- 开启或关闭动态分区
        hive.exec.dynamic.partition=false;
        -- 设置为nonstrict模式，让所有分区都动态配置，否则至少需要指定一个分区值
        hive.exec.dynamic.partition.mode=strict;
        -- 能被mapper或reducer创建的最大动态分区数，超出而报错
        hive.exec.max.dynamic.partitions.pernode=100;
        -- 一条带有动态分区SQL语句所能创建的最大动态分区总数，超过则报错
        hive.exec.max.dynamic.partitions=1000;
        -- 全局能被创建文件数目的最大值，通过Hadoop计数器跟踪，若超过则报错
        hive.exec.max.created.files=100000;
        
        -- 根据个人需要配置
        set hive.exec.dynamic.partition=true;  
        set hive.exec.dynamic.partition.mode=nonstrict;
        set hive.exec.max.dynamic.partitions.pernode=1000;
        set hive.exec.max.dynamic.partitions=10000;
        set hive.exec.max.created.files=1000000;
        ~~~

      - 混合使用时，静态分区必须在动态分区的前面

        ~~~sql
        insert overwrite table demo_static_partition 
        partition(year="2020", month="04", 
        day=day, hour=hour) 
        select user_id, user_name, 
        trade_year as year ,
        trade_month as month,
        trade_day as day,
        trade_hour as hour  
        from user_demo 
        where trade_year="2020" 
        and trade_month="04" 
        ~~~

        

- 多级分区

  - 比如一个需求：按照天分区，再按照小时分区

  - 这个文件是按照时间分区好的，因此需要执行手动分区

  - 在创建分区结构表时使用语句

    ~~~SQL
    partitioned by(daystr string, hourstr string)
    ~~~

  - 将HDFS上或本地的文件加载到分区结构表中，指定分区

    ~~~SQL
    partition (daystr='20150828',hourstr='18');
    partition (daystr='20150828',hourstr='19');
    ~~~

- 特点：

  - 分区是目录级的
  - 分区字段是逻辑存在，并不是物理存在的，实际的文件中并没有这个字段
  - Hive分区是将数据文件按照分类存储在不同的目录中，优化输入

#### 分桶结构表

> 实际使用中，除了为了用来**专门优化join减少比较的次数**，其他一无是处。

- 本质：**就是底层MapReduce的分区**(多个reduce下，在map端shuffle阶段为行数据打上标签用来标记被哪一个reduce处理)

- 规则：
  - 桶的个数：底层MapReduce中Reduce的个数
  - clustered by ：按照哪一列作为Map输出的Key，进行分区
  - 按照Key的哈希取余
  
- 注意：对于分桶表，不能使用load data的方式进行数据插入操作，因为load data导入的数据不会有分桶结构。

  > 如何避免针对桶表使用load data插入数据的误操作呢？
  >
  > 限制对桶表进行load操作  set hive.strict.checks.bucketing  = true;  
  >
  > 也可以在CM的hive配置项中修改此配置，当针对桶表执行load data操作时会报错。

- 如何将数据装载进入桶表呢？

  - 先创建临时表，通过load data将txt文本导入临时表。

    ~~~sql
    --创建临时表
    create table temp_buck(id int, name string)
    row format delimited fields terminated by '\t';
    --导入数据
    load data local inpath '/tools/test_buck.txt' into table temp_buck;
    ~~~

  - 使用insert select语句间接的把数据从临时表导入到分桶表。

    ~~~mysql
    --启用桶表
    set hive.enforce.bucketing=true;
    --限制对桶表进行load操作
    set hive.strict.checks.bucketing = true;
    --insert select
    insert into table test_buck select id, name from temp_buck;
    --分桶成功
    ~~~

> **注意**，hive使用对分桶所用的值进行hash，并用hash结果除以桶的个数做取余运算的方式来分桶，保证了每个桶中都有数据，但每个桶中的数据条数不一定相等。
>
> 如果另外一个表也按照同样的规则分成了一个个小文件。两个表join的时候，就不必要扫描整个表，只需要匹配相同分桶的数据即可，从而提升效率。
>
> 在数据量足够大的情况下，分桶比分区有更高的查询效率。

#### 分区和分桶的区别

1. 分桶和分区两者不干扰，可以把分区表进一步分桶；
2. 分桶对数据的处理比分区更加细粒度化：分区针对的是数据的存储路径；分桶针对的是数据文件；
3. 分桶是按照列的哈希函数进行分割的，相对比较平均；而分区是按照列的值来进行分割的，容易造成数据倾斜。
4. 分区表按照目录来拆分，不同分区就是不同的目录，而分桶表按照文件进行拆分，按照某一列的Hash值取余来装入不同的桶，桶的个数就是底层Reducer的个数



## Join与排序

### Join

- 内连接
- 左连接
- 右连接
- 全连接

> 注意：**严禁产生笛卡尔积**，大数据环境中的数据量巨大，而笛卡尔积会产生更大的数据量。

注意规避一下几种写法：

~~~MYSQL
# 产生笛卡尔积
select a.*, b.*
from a,b; 

# 为指定join条件，产生笛卡尔积
select a.*, b.*
from a join b;

# 不规范的join写法，使用where会在全部的数据中过滤从而得到指定条件的数据，因此是在笛卡尔积产生的条件下按照条件过滤得到想要的数据
select a.*, b.* 
from a join b where 条件;
~~~

- 底层实现：
  - reduce join：join过程发生在Reduce端
    - 特点：
      - 必须经过shuffle，通过shuffle将关联的字段分组，在reduce端进行关联
      - 适合于大表join大表
  - Map join：底层发生在map端，不经过shuffle
    - 特点：
      - 将小数据放入每台机器的内存中，所有的join都发生在内存中
      - Hive会优先调用map join，如果map join条件不能满足，会自动调用Reduce join（这由配置文件决定hive.auto.convert.join）
      - 适合小数据join大数据
  - SMB Join = Map Join + Bucket Join
    - 两张表都是桶表
    - B表桶的个数必须等于A表的桶的个数
    - join的字段 = 分桶的字段 = 排序的字段

### 排序

- order by：全局有序，只能有一个reduce
- sort by：局部有序，每个Reduce Task内部有序(如果只有一个reduce，其效果和order by效果一样)
- distribute by：干预底层MapReduce的分区，指定按照哪一列作为key进行分区
- clustered by：当distribute by 和sort by指定的字段是同一个字段时，可以直接使用clustered by

## 复杂数据类型

### array类型

~~~mysql
row format delimited fields terminated by '\t' --指定文件中列的分隔符
COLLECTION ITEMS TERMINATED BY ','; --指定数组中每个元素的分隔符
~~~



### Map类型

~~~mysql
row format delimited fields terminated by ',' --指定文件中列的分隔符
COLLECTION ITEMS TERMINATED BY '-' --指定每个KeyValue之间的分隔符
MAP KEYS TERMINATED BY ':'; --指定KEY和Value之间的分隔符
~~~



## 函数

### 内置函数

- 列举：

  ~~~mysql
  show functions；
  ~~~

- 查看用法：

  ~~~mysql
  desc function func_name;
  ~~~

- 查看函数和示例：

  ~~~mysql
  desc function extended func_name;
  ~~~

### 自定义函数

#### 分类

- UDF：一对一，普通
- UDAF：多对一，聚合
- UDTF：一对多
  - 比如explode

#### 开发使用

- 开发一个UDF：

  - 开发一个类继承自UDF类

    - 实现一个或者多个evaluate方法
      - 在evaluate方法中实现数据的处理逻辑
      - 将结果作为返回值返回

  - 将自己写的类打成jar包，添加到Hive的环境变量中

    - 本地编写类，打成jar包

    - 上传至Linux环境

    - 进入Hive(beeline)

      ~~~mysql
      add jar /export/datas/udf.jar
      ~~~

  - 在Hive中创建一个函数

    ~~~mysql
    create temporary function transDate as
    'bigdata.itcast.cn.hive.udf.UserUDF';
    ~~~

  - 使用自己开发的函数

    ~~~mysql
    select transDate("21/Sep/2019:13:30:00");
    ~~~

- UDTF的使用：一对多

  - 原始数据是一行一列
  - 需求结果是：多行多列

- UDAF：多对一，聚合



### 侧视图

> lateral view

- 功能：专门用于搭配UDTF使用，将UDTF与其他字段进行拼接

- 什么是视图？

  - 关键字：view

  - 语法：

    ~~~mysql
    create view | table
    ~~~

  - 定义：是一种只读表

  - 使用：当做表来使用，不过不能修改

- 设计：将UDTF的结果构建成一个类似于视图的形式，与原表进行拼接

- 使用：

  - 语法：

    ~~~mysql
    select …… from tabelA lateral view UDTF(xxx) 视图名 as a,b,c
    ~~~

  - 数据：

    ~~~mysql
    http://facebook.com/path/p1.php?query=1
    
    域名 路径 参数
    facebook.com /path/p1.php query=1
    ~~~

    

  - 示例：

    ~~~mysql
    select
        a.id,
        b.host,
        b.path
    from
        tb_url a
        lateral view parse_url_tuple(url, 'HOST',"PATH") b as host,path;
    ~~~

    

  















