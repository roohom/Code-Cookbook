# Zookeeper

## 辅助选举

- zookeeper帮别的分布式框架在两个主节点之间选择一个工作的一个备份的
- **方式一**：两个主节点A、B同时向zookeeper创建同一个临时节点(只有一个能创建成功)
  - 临时节点会随着创建者的消失而消失
  - A创建成功了，A就是工作状态的主节点
  - B创建失败就是备份状态Standby，B要监控这个临时节点
    - 如果临时节点消失，说明A出现了问题
    - B会创建这个临时节点，B成为新的active
- 方式二：两个主节点A、B都向zookeeper创建同一个临时顺序节点，两个都能创建成功
  - 临时顺序：谁先创建成功，谁的编号就小
  - 谁的编号小谁就是active，剩余的是Standby

## ZK选举

- zookeeper自己内部选择leader

- 三台zookeeper

  - 一台leader
  - 两台follower

- 选举规则

  - zxid：最新的数据id

    - 越新的数据，id越大

  - myid：权重id

    - 自己指定

      ~~~shell
      # 集群中机器.权重 =机器名称.选举端口:同步端口
      server.1=node1:2888:3888
      server.2=node2:2888:3888
      server.3=node3:2888:3888
      ~~~

      

    - 记录每台机器初始的权重，存储在dataDir下

  - 规则：先判断zxid，如果zxid相同，再判断myid

    - 越大月优先

  - 情况1：刚搭建第一次启动

    - 所有节点的zxid都为0，不比较zxid
    - 先启动第一台机器：第一台给自己投票（1票，myid=1）
    - 启动第二台机器：第二台机器给自己投票（1票，myid=2）
    - 第一台机器会改投第二台，第二胎机器有2票，投票超过半数
    - 第二台机器成为leader

  - 情况2：leader故障，剩余的follower重新选举新的leader

    - 机器情况:
      - node1：follower
      - node2：follower
      - node3：leader
      - node4：follower
      - node5：follower
    - 写入数据：leader来广播
      - 客户端发起写入请求:4
      - 不论请求哪一台，这个请求都由node3来执行
      - node3进行广播，超过半数的机器写入成功，就会返回成功了
        - 这样设计的原因：块
        - 超过半数的机器写入成功，说明只要zookeeper集群可用，数据就正常
      - 极端情况：刚超过半数，leader宕机
        - 所有的follower重新选举
        - 先比较zxid，谁的数据就越全，谁就会优先成为leader
        - 如果zxid相同，就比较myid
        - node2成为新的leader，会将数据广播给所有的follower

    

## 节点类型

- 类型

  ~~~shell
  create [-s] [-e] path data
  -s :创建有序节点
  -e :创建临时节点
  ~~~

  

  - 持久性节点：除非手动删除，不会自动删除

    - ~~~shell
      create path data
      ~~~

  - 持久有序节点：会给节点的名称自动编号，不会自动删除

    - ~~~shell
      create -s path data
      ~~~

  - 临时节点：会随着所创建的客户端的消失而自动删除

    - ~~~shell
      create -s path data
      ~~~

  - 临时有序节点：会随着客户端的连接断开而自动删除，会自动编号

    - ~~~shell
      create -s -e path data
      ~~~

## 监听机制

- 监听：监控某个节点所发生的变化：创建、删除，修改等
  - 只要发生对应的变化，就将这个变化获取到
  - 两个主节点，A是工作的，B是备份的，B要监听A创建的临时节点，如果这个临时节点消失，说明A故障，B要获取到这个节点删除这个信息，然后B重新创建这个节点，成为工作状态
  - 设置监听：watch：命令行中的监听是一次有效，一旦触发，需要重新设置监听
    - 设置：如 `ls path watch`,重点在于后面加上了可选项`watch`



## 基本使用

- 启动服务端

  ~~~shell
  cd /export/servers/zookeeper-3.4.6/
  bin/zkServer.sh start
  ~~~

- 查看状态

  ~~~shell
  bin/zkServer.sh status
  ~~~

- 关闭服务

  ~~~shell
  bin/zkServer.sh stop
  ~~~

- 客户端连接服务端

  ~~~sehll
  bin/zkCli.sh -server hostname:port
  # 连接多台
  bin/zkCli.sh -server node1:2181,node2:2181,node3:2181
  ~~~

- 列举：只能使用绝对路径

  ~~~shell
  ls  path [watch]
  
  ls  /
  ~~~

- 创建

  ~~~shell
  create [-s] [-e] path data
  create /itcast hadoop
  ~~~

- 读取节点

  ~~~shell
  get path [watch]
  
  get /itcast
  ~~~

- 修改节点

  ~~~shell
  set path data [version]
  
  set /itcast  spark
  ~~~

- 删除节点

  ~~~shell
  rmr path
  
  rmr /itcast/heima
  ~~~

- 退出客户端

  ~~~shell
  quit
  ~~~

  

