# Hadoop搭建总体步骤

## Linux集群环境

- 三台机器
- 配置
  - 机器名映射
  - 防火墙和selinux
  - 免秘钥登录
  - 时钟同步
  - JDK
  - MySQL
    - Java：存储业务数据、用户信息、商业信息、订单信息
    - 大数据：用于存储关键性数据
      - 软件元数据
      - 分析的结果

## 节点规划

设计每个进程启动在哪些机器上

- 整个Hadoop启动的进程

  - HDFS：NameNode，DataNnode
  - YARN：ResourceManager，NodeManager

- 整个Hadoop启动的进程

  - HDFS：NameNode ，DataNode
  - YARN：ResourceManager，NodeManager

- 节点规划

  |      机器       | node1 | node2 | node3 |
  | :-------------: | :---: | :---: | :---: |
  |    NameNode     |   *   |       |       |
  |    DataNode     |   *   |   *   |   *   |
  | ResourceManager |       |       |   *   |
  |   NodeManager   |   *   |   *   |   *   |

  

- 启动和关闭hdfs（未配置环境变量的情况下要去sbin目录下）

  ~~~shell
  start-dfs.sh
  stop-dfs.sh
  ~~~

  

- 启动和关闭yarn

  ~~~shell
  start-yarn.sh
  stop-yarn.sh
  ~~~

  

## Hadoop分布式上安装

- 解压安装

- 修改配置

  - *-env.sh：用于配置环境变量
    - hadoop-env.sh
    - mapred-env.sh
    - yarn-env.sh
  - *-site.xml
    - core-site.xml
    - hdfs-site.xml
      - dfs.replication：配置每个文件块的副本数
    - mapred-site.xml
    - yarn-site.xml
  - slaves：用于配置从节点[DataNode、NodeManager]地址
    - 计算节点都与存储节点在同一台机器（DataNode也是NodeManager）

- 启动服务

  - 第一次启动服务吗，需要格式化

    - 只能在NameNode所在的机器格式化

      ~~~
    hdfs namenode -format
      ~~~

  - core-site.xml和hdfs-site.xml配置编写错误，修正后需要重新格式化
  
  - 启动

    - 启动hdfs

      ~~~shell
      start-dfs.sh 只能在NN所在的机器启动
      ~~~

    - 启动yarn

      ~~~shell
      start-yarn.sh 只能在RM所在的机器启动
      ~~~
  
  - 端口：
  
    - HDFS：NameNode启动开放
      - 8020：RPC协议，用于客户端请求服务端，节点之间的远程调用
      - 50070：http协议，用于访问网页
    - YARN：ResourceManager启动开放
      - 8032：RPC协议，用于客户端请求服务端，节点之间的远程调用
      - 8088：http协议，用于访问网页

