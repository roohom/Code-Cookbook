# Redis

## 介绍

- 本质：分布式的**基于内存**的NoSQL**数据库**
  - 数据库：用于存储数据的
  - 分布式：解决了高并发和存储能力的问题
  - 特点：
    - 基于内存
    - 所有的数据都会存储在内存中，所有的读写都直接操作内存
      - 问题
        - 内存：小、易丢失
      - 解决
        - 小：集群分布式构成**分布式内存**
        - 易丢失：虽然数据都在内存中，但磁盘中保留一份数据，每次重新启动都会从磁盘中将数据加载到内存
      - 问题：写入磁盘又需要提供高性能的读写，如何实现？
        - 数据安全和性能必须二选一
        - 保证数据安全的情况的前提下提供最好的性能
- 功能：基于数据库设计，实现数据存储
- 实现：基于内存的数据存储
- 数据库分类：
  - RDBMS：关系型数据库管理系统
    - MySQL、Oracle、SQLServer
    - 特点：
      - 一般都支持SQL语句
      - 允许数据之间的关联
      - 存储容量较小，存储数据量如果较大性能就会下降
    - 区别：性能的区别
  - NoSQL(Not Only SQL)：非关系型数据库
    - Redis、Hbase、MongoDB
    - 特点：
      - 每种NoSQL的特点都不一样
      - 为了追求小数据量高性能读写如Redis
      - 为了解决大数据量的高性能读写如HBase

## 应用场景

- 传统的web开发
  - 用于实现读缓存
    - 传统网站架构
      - 同时大量的并发读写请求MySQL，而MySQL无法响应支持这种高并发的场景，导致请求失败
  - 引入Redis
    - 实现读写分离，写入MySQL，将大量的高并发的**读**请求提交给Redis来实现
- 大数据的应用场景
  - 适合于高并发的场景
  - 适合于读写性能要求非常高的场景

## 特点

- 分布式
- 基于内存
- 基于C语言开发，对内存的管理、编译、数据的存储更加的高效
- 支持高并发：并发量：单台机器10w/s
- 不能代替MySQL
  - MySQL：支持复杂的业务，以及复杂数据存储，支持SQL，更加稳定
  - Redis：高并发高性能，存在数据丢失的隐患，存储结构比较单一，不能满足业务存储

## Windows上使用Redis

- 架构
  - Standalone：单节点

- 使用
  - 启动服务端
    - Redis-server.exe
  - 启动客户端
    - Redis-cli.exe

- 数据结构
  - KV结构：
    - 整个Redis中所有的数据都是以KV进行读写的
    - 通过K来读写Value
  - 数据类型
    - K：Redis中每条数据即每个KV的K都是String类型的(**永远都是String类型**)
    - V：Redis的V有五种类型结构
      - String：字符串类型
      - Hash：类似于Java中的Map集合
        -  Java：
          - Map1（K：string， map2：HashMap）
      - List：集合类型，有序可重复集合
      - Set：集合类型，无序不可重复
      - Zset：集合类型，有序不可重复集合
        - 类似于Java中的TreeMap

## 数据类型和语法

### String

### Hash

- 语法

  - 单个属性写入：hset

    ~~~
    hset	K	V[]
    ~~~

  - 单个属性读取：hget

    ~~~
    hget	K	v1
    ~~~

  - 批量添加：hmset

    ~~~
    hmset 	K 	V[k1  v1  K2  v2 ……]
    ~~~

  - 批量化读取：hmget

    ~~~
    hmget K K1 K2 K3
    ~~~

  - 获取所有的属性：hgetall

    ~~~
    hgetall K
    ~~~

  - 删除Hash中的某个元素：hdel

    ~~~
    hdel  K  K1
    ~~~

### List

- 应用：有序可重复的集合的数据

  - 类似于Java中的List
  - 用于存放一系列有序变化的数据

- 使用

  - 插入

    - 左序插入：lpush

      ~~~shell
      lpush K V[e1 e2 e3 e4]
      ~~~

      ~~~shell
      #实际存放的是
      K  e4 e3 e2 e1
      ~~~

      

    - 右序插入：rpush

      ~~~
      rpush K V[e1 e2 e3 e4]
      ~~~

      ~~~shell
      #实际存放的是
      K  e1 e2 e3 e4
      ~~~

      

  - 读取：lrange

    ~~~
    lrange K start end
    ~~~

    ~~~shell
    #左序查询：起始位置为0
    lrange list1  0  1
    #右序查询
    
    ~~~

  - 长度：llen

    ~~~shell
    llen K
    ~~~

  - 删除元素

    - 左边删除：lpop

      ~~~shell
      lpop K
      ~~~

    - 右边删除：rpop

### Set

- 应用：无序不可重复的集合，用于去重统计等等

  - 类似于Java中的set集合

- 使用：

  - 插入数据：sadd

    ~~~
    sadd  K  V[e1 e2 e3...]
    ~~~

  - 查询数据：smembers

    ~~~
    smembers K
    ~~~

  - 元素判断：sismember

    - 判断当前set元素是否是该set的成员

      ~~~
      sismembers  K  e
      ~~~

  - 元素的移除：srem

    ~~~
    srem  K  e
    ~~~

### Zset

- 应用：有序不可重复的集合，一般用于排序取TopN

- 使用

  - 添加元素：zadd

    ~~~
    zadd  	K   [score1 V1 score2 V2 score3 V3]
    ~~~

  - 查询：zrange

    - 默认升序

    ~~~
    zrange  K   start  end    [withscores]
    ~~~

    > 在使用Redis时，不建议存储double类型的score，因为其在底层会有精度为题
    >
    > 如果需要存储double类型，将其转换为int类型
    >
    > 写:20.01 x 100 = 2001
    >
    > 读:2001 / 100 = 20.01

  - 倒叙查询：zrevrange

    ~~~
    zrevrange  K  start  end [withscores]
    ~~~

  - 取集合长度：zcard

    ~~~
    zcard K
    ~~~

  - 移除元素：zrem

    ~~~
    zrem   K   Vkey
    ~~~

    

### 通用命令

- `key *` ：列举当前数据库中的所有KV
- `del`：用于删除当前数据库中的某个KV
  
  - `del name`
- `exists`：用于判断当前数据库中是否存在某个key
  
  - `exists K`
- type：用于查看某个K的类型
  
  - `type K`
- select ：切换数据库

- move：用于实现数据库之间key的移动

  ~~~shell
  #切换进1数据库
  select 1
  #将数据库1中的s2移动至0数据库下
  move s2 0
  ~~~




## 持久化

- Redis如何实现将内存中的数据写入磁盘
  - RDB：默认的持久化方式
  - AOF：工作中使用

### RDB

- 功能：在规定时间内，内存中产生了一定次数的更新(增删改)，就会将内存中的数据做一次全量快照

- 实现：

  - 自动实现：配置文件决定

    ~~~
    save  时间  数据更新的次数
    save  300   	10
    ~~~

  - 如果300秒内，产生了十次数据更新，就将内存中的数据全量覆盖到本地磁盘

  - 配置文件中的默认规则

    ~~~
    save  900   1
    save  300   10 
    save  60    10000
    ~~~

    - 可以配置多组策略，热河一组达到条件，都会触发快照的生成

    - 多组策略的设计目的：保证各种读写场景下的数据安全

      - 读多、写少：不需要频繁地构建快照，内存与文件的数据基本一致
      - 写多、读少：数据更新地比较频繁，短时间内有大量数据生成，需要频繁更新

    - 快照存放的位置

      ~~~
      /export/server/{$Redis}/redisdata/
      ~~~

  - 手动生成

    - save：手动阻塞Redis的所有请求，将内存的数据做一次全量快照写入磁盘
      - 指导快照生成完成，恢复所有的读写请求
    - bgsave：后台启动一个线程来实现快照生成，不影响读写不影响业务

- 优缺点

  - 优点：
    - 每次做的是全量快照，内存中的数据肯定和磁盘中的数据一样
    - 这种快照是二进制文件，生成和读写都很快
  - 缺点：
    - 容易产生数据丢失
    - 达到了时间，但是更新次数没达到，如果机器故障，已经更新的数据就丢失了

### AOF

- 设计：

  - 规定时间内或者指定操作做增量的同步
    - 每次只将内存中发生变化的数据**追加写入**磁盘

- 规则：

  ~~~
  appendfsync no:不进行fsync，将flush文件的实际交给OS决定，速度最快
  appendfsync always:每写入一条日志就进行一次fsync操作，数据安全性最高，但是速度最慢
  appendfsync everysec:折中的做法，交由后台线程每秒fsync一次，每秒将内存更新的数据同步追加到磁盘中，最多会产生1s的数据丢失
  ~~~

- 一般选用第三种方式，即appendfsync everysec

- 优缺点

  - 优点：数据丢失的概率或者比例变小，数据相对安全，而且保证了性能

  - 缺点：

    - 以追加的方式，将内存中更新的数据写入普通文本文件

      - 相对于二进制文件，写入和读取加载都比较慢

    - 内存数据与磁盘数据不一致

      - 解决：定期做全量

        ~~~
        #如果当前的数据相对于上一次的初始文件增长了百分之百，就做一次全量
        auto-aof-rewrite-percentage 100
        auto-aof-rewrite-min-size 64MB
        ~~~




## 集群搭建

### 模式

- 单节点
  - 一台机器Redis
    - 如果这台Redis故障，会导致整个业务不可用
    - 一台机器的内存有限，无法实现大数据的实时存储
- 集群模式
  - 主从复制
  - 哨兵模式
  - 集群模式/分区模式

### 主从复制

- 架构

  - 类似于Zookeeper
  - 主从节点
    - Master：主节点
      - 负责提供读写
    - Slave：从节点
      - 负责提供读，不能接受写的请求
      - 会写Master同步数据

- 特点

  - 每台节点上存储的内容是一致的
  - 只有Master能够接受写的请求
  - 如果Master故障，Slave不能变成Master

- 问题

  - Master存在单点故障，导致集群不可写入

- 配置

  - 修改node2和node3的配置文件

    ```
    #修改265行，指定master地址
    slaveof node1 6379
    ```

  - 启动所有机器的redis-server

    ```
    cd /export/servers/redis-3.2.8
    src/redis-server redis.conf
    ps -ef | grep redis
    ```

  - 连接第一台机器客户端

    ```
    src/redis-cli -h node1
    ```

  - 写入一条数据

    ```
    set s1 bigdata
    ```

  - 观察其他节点的数据，在从节点尝试写入数据

### 哨兵模式Sentinel

- 架构
  - 主从架构
    - 主：Master
    - 从：Slave
    - 哨兵进程：
      - 负责监听Master以及其他节点，如果发现Master宕机，就会从Slave中重新选举一个新的Master
      - 监听所有的节点，并且哨兵之间互相通信
  - 特点：
    - 每台节点存储的数据是一样的
  - 区别：与主从复制的区别
    - Slave可以选举成为Master
  - 设计
    - Step1：哨兵进程会监听Master。如果有一个哨兵发现Master故障，会通知其他的哨兵
      - 主观性Master故障
    - Step2：一旦达到配置的哨兵个数认为Master故障，确认Master中的故障
      - 客观性Master故障
    - Step3：从Slave中根据选举规则选举出新的Master
- 问题
  - 解决了Master单点故障，但是依旧存在Redis集群存储容量负载的问题
  - 哨兵本身的机制也存在一些缺点
    - 不支持动态扩容

- 配置
  - 关闭三台机器的redisserver

  - 修改三台机器的sentinel.conf

    ```shell
    cd /export/servers/redis-3.2.8
    vim sentinel.conf
    #在第15行下面添加以下两行，指定地址和后台运行，每台机器要改成自己的主机名
    bind node1
    daemonize yes
    #修改第71，监控master地址。mymaster是master的逻辑名称，node1是当前master的地址，2表示有2个哨兵认为故障就要切换
    sentinel monitor mymaster node1 6379 2
    ```

  - 启动三台机器的redis server和哨兵进程

    ```shell
    cd /export/servers/redis-3.2.8
    src/redis-server redis.conf
    src/redis-sentinel sentinel.conf 
    ps -ef | grep redis
    ```

  - 测试关闭第一台进程

  - 代码中如何实现连接访问

    ~~~
    方案三：构建哨兵连接池：第一个参数是master的逻辑名称，第二个参数是哨兵列表，第三个是连接池的配置
    HashSet<String> sets = new HashSet<>();
    sets.add("node1:26379");
    sets.add("node2:26379");
    sets.add("node3:26379");
    JedisSentinelPool mymaster = new JedisSentinelPool("mymaster", sets, jedisPoolConfig);
    从连接池中获取连接
    jedis = mymaster.getResource();
    ~~~

    - 解决了Master单点故障，但是依旧存在redis集群存储容量负载的问题
    - 哨兵本身的机制也存在一些缺点

  

### 集群模式

- 架构
  - 设计：将一个Redis的普通集群当做Redis集群模式的一个部分，利用多个Redis集群来存储不同的数据
  - 去中心化思想

- 配置

  - 演示：一台机器启动三个Redis：作为三个Master，只要端口不一致即可

  - 第一台机器解压重新安装

    ```
    cd /export/software/
    tar -zxf redis-3.2.8.tar.gz -C /export/
    ```

  - 编译

    ```
    cd /export/redis-3.2.8/
    make && make install
    ```

  - 创建目录

    ```shell
    mkdir -p /export/redis-3.2.8/cluster 
    cd  /export/redis-3.2.8/cluster
    mkdir 7001 7002 7003 
    cp /export/redis-3.2.8/redis.conf  7001/
    ```

  - 修改7001目录下的配置文件

    ```shell
    cd /export/redis-3.2.8/cluster/7001
    vim redis.conf
    #61行：绑定redis server地址
    bind node1
    #84行：修改redis实例的端口
    port 7001
    #128行：开启守护进程
    daemonize yes
    #593行：开启aof
    appendonly yes
    #721行：开启集群模式
    cluster-enabled yes 
    #729行：指定redis默认配置文件
    cluster-config-file nodes.conf
    #735行：指定超时时间
    cluster-node-timeout 5000
    ```
  
  - 将配置文件复制给7002和7003，并修改端口为7002和7003
  
    ```shell
    cd /export/redis-3.2.8/cluster/7001
    cp redis.conf ../7002/
    cp redis.conf ../7003/
    vim ../7002/redis.conf
    #84行：修改redis实例的端口
    port 7002
    vim ../7003/redis.conf
    #84行：修改redis实例的端口
    port 7003
    ```
  
  - **启动三个redis实例**
  
    ```shell
    cd /export/redis-3.2.8/cluster/7001
    redis-server redis.conf
    cd /export/redis-3.2.8/cluster/7002
    redis-server redis.conf
    cd /export/redis-3.2.8/cluster/7003
    redis-server redis.conf
    ```
  
  - 安装ruby环境
  
    - 安装依赖
      
  ~~~shell
      yum install openssl-devel  zlib-devel  -y
~~~
      
      
      
    - 将ruby安装包上传到/export目录中
      ```
      cd /export/
      tar -zxvf ruby-2.5.3.tar.gz
      cd ruby-2.5.3
      ./configure --prefix=/usr/local/ruby
      make && make install
      echo "export PATH=$PATH:/usr/local/ruby/bin" >> /etc/profile
      source /etc/profile
      gem install redis
      ```
  
- 创建redis集群
  ```shell
  cd /export/redis-3.2.8/src/
  ./redis-trib.rb create --replicas 0 192.168.88.221:7001 192.168.88.221:7002 192.168.88.221:7003
  ```

  ~~~
  执行./redis-cli --cluster create ip:端口
  报Node 192.168.248.12:7001 is not empty.
  	 Either the node already knows other nodes (check with CLUSTER NODES)
  	 	 or contains some key in database 0.错误
  
  解决办法：
  	1，先kill redis创建的集群节点进程
  	2，删除每个redis节点的appendonly.aof文件，dump.rdb文件，nodes.conf文件
  		并且执行./redis-cli  使用 flushdb命令，清空每个redis里面的数据。
  	3，重启每个redis节点，再执行集群操作即可
  ~~~
  
  
  
- 启动客户端测试
  ```shell
  cd /export/redis-3.2.8/
  src/redis-cli -c -h node1 -p 7001
  
  -c：表示是一个集群模式
  ```

- 常用操作

    - `cluster nodes`：列举出当前集群的所有节点，以及节点的相关信息
    - `cluster info` ：查看集群的信息

- Jedis代码中的连接
  ```java
  JedisCluster jedisCluster = null;
  
  //构建集群模式的额连接池
  HashSet<HostAndPort> sets = new HashSet<HostAndPort>();
  sets.add(new HostAndPort("node1",7001));
  sets.add(new HostAndPort("node1",7002));
  sets.add(new HostAndPort("node1",7003));
  jedisCluster = new JedisCluster(sets, jedisPoolConfig);
  ```

#### 动态添加和删除节点

> 参考文章,[传送门](https://www.cnblogs.com/maybesuch/p/10309403.html) 或者[Redis Cluster日常操作命令梳理](https://www.cnblogs.com/kevingrace/p/7910692.html)

## Redis的数据分区

### [虚拟槽分区](https://blog.csdn.net/Coxhuang/article/details/104645989/)

> 虚拟槽分区巧妙地使用了哈希空间，使用分散度良好的哈希函数把所有数据映射到一个固定范围的整数集合中，整数定义为槽（slot）。这个范围一般远远大于节点数，
>
> Redis Cluster采用虚拟槽分区，比如 Redis Cluster 槽范围是 0 ~ 16383。Redis 集群包含了 16384 个哈希槽，每个 Key 经过计算后会落在一个具体的槽位上，而每个槽位落到哪个节点上,根据自己的节点配置。

> 假设,当前集群有 5 个节点，每个节点平均大约负责 3276 个槽。由于采用高质量的哈希算法，每个槽所映射的数据通常比较均匀，将数据平均划分到 5 个节点进行数据分区。Redis Cluster 就是采用虚拟槽分区。
>
> 节点1： 包含 0 到 3276 号哈希槽。
>
> 节点2：包含 3277 到 6553 号哈希槽。
>
> 节点3：包含 6554 到 9830 号哈希槽。
>
> 节点4：包含 9831 到 13107 号哈希槽。
>
> 节点5：包含 13108 到 16383 号哈希槽。
>
> 注意一个思想,槽位是落在节点上的,且我们可以任意配置那些槽位落在哪个节点上
>
> 这种结构很容易添加或者删除节点。如果增加一个节点 6，就需要从节点 1 ~ 5 获得部分槽分配到节点 6 上。如果想移除节点 1，需要将节点 1 中的槽移到节点 2 ~ 5 上，然后将没有任何槽的节点 1 从集群中移除即可。
>
> 由于从一个节点将 哈希槽 移动到另一个节点并不会 停止服务，所以无论 添加删除或者改变某个节点的哈希槽的数量都不会造成集群不可用的状态.



### 分区的规则

- 通过槽位计算，将不同的KV存储在不同的Redis的Master中
- Redis Cluster 采用虚拟槽分区(Redis Cluster是Redis自带的集群)，所有的键根据哈希函数映射到 0~16383 整数槽内，计算公式：`slot = CRC16（key）& 16383`。每个节点负责维护一部分槽以及槽所映射的键值数据。

- `CRC16【K】 &  16383  =  0 ~ 16383`
    - 对K进行计算
  - 根据不同的槽位值，写入不同的Redis的Master中



## 可能遇到的问题

- 1、redis-cluster 启动或者Jedis客户端连接遇到**CLUSTERDOWN Hash slot not served**问题

  - 解决办法：

    ~~~shell
    cd ${REDIS_HOME}/src
    redis-trib.rb check node01:7001
    redis-trib.rb check node01:7002
    redis-trib.rb check node01:7003
    ~~~

    > node01为机器实际IP地址

  - 上述运行之后会提示错误

    - 再对每一台机器修复问题

      ~~~shell
      cd ${REDIS_HOME}/src
      redis-trib.rb fix node01:7001
      redis-trib.rb fix node01:7002
      redis-trib.rb fix node01:7003
      ~~~

  - 或者重新创建集群

    ~~~SHELL
    cd ${REDIS_HOME}/src/
    ./redis-trib.rb create --replicas 0 192.168.88.221:7001 192.168.88.221:7002 192.168.88.221:7003
    ~~~

- 2、JedisClusterException: CLUSTERDOWN Hash slot not served

  - （1）报错JedisClusterException: CLUSTERDOWN Hash slot not served

    - 解决：进入redis的src目录下使用命令redis-trib.rb check 127.0.0.1:7001检测，再使用redis-cli --cluster fix 192.168.88.221:7001修复，可是又报一个ruby的loadError

  - （2）报ruby的loadError是因为缺少redis库

    - 解决：使用命令gem install redis安装redis库

  - （3）搞定以上之后再去创建集群

    - 解决：

      ~~~shell
      # 进入redis的src目录下使用命令：
      ./redis-trib.rb create --replicas 0 192.168.88.221:7001 192.168.88.221:7002 192.168.88.221:7003）
      # 敲个yes发现还是不行，slot槽被占用
      ~~~

    - 错误提示： slot插槽被占用了（这是搭建redis集群前，以前redis的旧数据和配置信息没有清理干净。）
    - 解决方法： 使用redis-cli 登录到每个节点执行 flushall 和 cluster reset 命令就可以了。
      - 登陆客户端命令： redis-cli
      - 清除所有缓冲区命令： flushall
      - 重置redis集群命令： cluster reset 完成之后再次创建集群即可

    - 参考：
      - https://blog.csdn.net/qq_39244264/article/details/80281702
      - https://blog.csdn.net/weixin_44422604/article/details/106955119













