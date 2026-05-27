# Sqoop

## 简单使用

- 本质：底层利用MapReduce来实现将数据从A转移至B

  > 注意：sqoop不支持分桶表，如果需要从sqoop导入数据到分桶表，可以通过中间临时表进行过度。ODS也可以不做分桶，从DWD明细层开始分桶。

基本使用

- 语法

  ~~~shell
  sqoop import
  ~~~

- 输入 (从MySQL输入)

  ~~~shell
  #指定读取的MySQL的表的地址
  --connect jdbc:mysql://hostname:3306/dbname
  #指定MySQL用户名和密码
  --username root
  --password 123456
  #指定读取的表
  --table  tbname
  ~~~

- 输出 (输出到HDFS)

  ~~~shell
  #指定写入HDFS什么位置,如果不指定，默认输出路径在HDFS当前用户的家目录下/user/root
  --target-dir
  ~~~

- 候选参数：

  ~~~shell
  -m / --mapper：指定mapTask的个数
  --delete-target-dir：用于提前删除输出目录
  --fields-terminated-by：指定输出【HDFS】的列的分隔符
  --where ：限定导入哪些行
  --columns：限定导入哪些列
  -e / --query ：指定对SQL语句的结果进行导入必须使用where加上 $CONDITIONS
  ~~~

  

- 示例：

  ~~~shell
  sqoop import \
  --connect jdbc:mysql://hadoop01:3306/sqoopTest \
  --username root \
  --password 123456  \
  # --table tb_tohdfs \
  -e 'select id,name from tb_tohdfs where id < 2 and $CONDITIONS' \
  --delete-target-dir \
  --target-dir /sqoop/import/test01 \
  --fields-terminated-by '\t' \
  -m 1
  ~~~

### 导入Hive

- 在Hive中创建表

  ~~~shell
  use default;
  create table fromsqoop(
  id int,
  name string,
  age int
  );
  ~~~

- 方式一：

  ~~~shell
  sqoop import \
  --connect jdbc:mysql://hadoop01:3306/sqoopTest \
  --username root \
  --password 123456 \
  --table tb_tohdfs \
  --delete-target-dir \
  --hive-import \
  --hive-database default \
  --hive-table fromsqoop \
  -m 1
  ~~~

  - 原理：

    - 连接至MySQL中的sqoopTest数据库读取tb_hdfs表
    - 上一步的表被导入到HDFS中默认目录（/user/root/）下
    - 将HDFS中默认位置下的表load加载到Hive表目录下

  - 候选参数：

    ~~~shell
    --create-hive-table：如果hive表不存在，自动创建
    --hive-database：指定导入哪个数据库
    --hive-table：指定导入哪张表
    --hive-import：申明导入Hive 表
    --hive-overwrite：覆盖表中所有内容
    --hive-partition-key：指定导入Hive分区的Key
    --hive-partition-value：指定导入Hive分区的value
    ~~~

- 方式二：

  ~~~shell
  sqoop import \
  --connect jdbc:mysql://hadoop01:3306/sqoopTest \
  --username root \
  --password 123456 \
  --table tb_tohdfs \
  --hcatalog-database default \
  --hcatalog-table fromsqoop \
  -m 1
  ~~~

  - 原理：直接访问元数据来实现数据的放置
  - --hcatalog-databas：指定数据库的名称
  - --hcatalog-table：指定表名称

### 导出

- 语法：

  ~~~shell
  sqoop export
  ~~~

- 输入：从HDFS输入sqoop

  ~~~shell
  #不论导出HDFS还是Hive，基本原理都是导出HDFS数据，指定的导出HDFS上哪里的数据
  --export-dir    hdfsPath
  ~~~

- 输出：从sqoop输出到MySQL

  ~~~shell
  #指定写入的MySQL的表的地址
  --connect jdbc:mysql://hostname:3306/dbname
  #指定MySQL用户名和密码
  --username root
  --password 123456
  #指定写入的表
  --table  tbname
  ~~~

- 测试：

  - MySQL建表

    ~~~mysql
    use sqoopTest;
    CREATE TABLE `tb_url` (
      `id` int(11) NOT NULL,
      `url` varchar(200) NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    ~~~

  - 在Hive中建表

    ~~~shell
    #在第二台机器上写
    vim /export/datas/lateral.txt
    1	http://facebook.com/path/p1.php?query=1
    2	http://www.baidu.com/news/index.jsp?uuid=frank
    3	http://www.jd.com/index?source=baidu
    
    use default;
    create table tb_url(
    id int,
    url string
    ) row format delimited fields terminated by '\t';
    
    load data local inpath '/export/datas/lateral.txt' into table tb_url;
    ~~~

  - 导出：

    ~~~shell
    sqoop export \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password 123456 \
    --table tb_url \
    --export-dir /user/hive/warehouse/tb_url \
    --input-fields-terminated-by '\t' \
    -m 1
    ~~~

    - `--input-fields-terminated-by`：必须指定HDFS文件的 分隔符

## 增量导入

### 应用场景

- 功能：Sqoop将数据采集到的Hive、HDFS

  - MySQL：业务数据库
  - Hive：数据仓库

- 设计思想

  - 以新旧数据的差异来实现增量导入
  - 方式一：以某一列自增的值来判断
  - 方式二：以时间列来判断

- 增量的实现：

  ~~~shell
  Incremental import arguments:
     --check-column <column>        Source column to check for incremental
                                    change
     --incremental <import-type>    Define an incremental import of type
                                    'append' or 'lastmodified'
     --last-value <value>           Last imported value in the incremental
                                    check column
  ~~~

  - `--check-column`：用于检查数据的列，用于区分新老数据
  - `--incremental`：使用哪一种方案来实现
    - `append`：方案一，用自增的一列数值来实现增量
    - `lastmodified`：方案二，用时间列来实现增量
  - `--last-value`：上次采集的最后一个值

#### 方式一：Append

- 问题：Append只能基于自增的列，将新增的数据增量导入，如果数据被更新，append不能实现

- 实现：

  ~~~shell
  sqoop import \
  --connect jdbc:mysql://hadoop01:3306/sqoopTest \
  --username root \
  --password 123456 \
  --table tb_tohdfs \
  --delete-target-dir \
  --target-dir /sqoop/import/test02 \
  --fields-terminated-by '\t' \
  --check-column id \
  --incremental append \
  --last-value 4 \
  -m 1
  ~~~

- 次日新增了数据四条

- 增量导入

  ~~~shell
  sqoop import \
  --connect jdbc:mysql://hadoop01:3306/sqoopTest \
  --username root \
  --password 123456 \
  --table tb_tohdfs \
  --target-dir /sqoop/import/test02 \
  --fields-terminated-by '\t' \
  --incremental append \
  --check-column id \
  --last-value 4 \
  -m 1
  ~~~

#### 方式二：lastmodified

- 应用场景：适合于采集更新的数据和新增的数据

- 要求：必须有时间列

- 使用模板：

  - MySQL中测试数据

    ~~~mysql
    CREATE TABLE `tb_lastmode` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `word` varchar(200) NOT NULL,
      `lastmode` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP  ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
    insert into tb_lastmode values(null,'hadoop',null);
    insert into tb_lastmode values(null,'spark',null);
    insert into tb_lastmode values(null,'hbase',null);
    ~~~

  - 第一次导入HDFS

    ```shell
    sqoop import \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password 123456 \
    --table tb_lastmode \
    --target-dir /sqoop/import/test03 \
    --fields-terminated-by '\t' \
    --incremental lastmodified \
    --check-column lastmode \
    --last-value '2020-01-01 00:00:00' \
    -m 1
    ```

  - 第二天：数据发生了变化

    ```
    insert into tb_lastmode values(null,'hive',null);
    update tb_lastmode set word = 'sqoop' where id = 1;
    ```

  - 第二次采集

    ```shell
    sqoop import \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password 123456 \
    --table tb_lastmode \
    --target-dir /sqoop/import/test03 \
    --fields-terminated-by '\t' \
    --merge-key id \
    --incremental lastmodified \
    --check-column lastmode \
    --last-value '2020-09-05 11:50:31' \
    -m 1
    ```

    - --merge-key：按照哪个字段进行合并



### 增量导出

#### 方式一：updateonly

- **这种方式只会导出更新的数据，新增的数据不会被导出**

- 使用模板：

  - 原始数据：

    ~~~txt
    1       http://www.Facebook.com/path/p1.php?query=1
    2       http://www.baidu.com/news/index.jsp?uuid=frank
    3       http://www.jd.com/index?source=baidu
    ~~~

  - 导入表：

    ~~~shell
    load data local inpath '/export/datas/lateral.txt' into table tb_url;
    ~~~

  - 更改数据

    ~~~txt
    1       http://www.dumain.com/path/p1.php?query=1
    2       http://www.baidu.com/news/index.jsp?uuid=frank
    3       http://www.jd.com/index?source=baidu
    4       http://www.domain.com
    ~~~

  - 覆盖表中的数据

    ```shell
    load data local inpath '/export/datas/lateral.txt' overwrite into table tb_url;
    ```

  - 增量导出

    ```shell
    sqoop export \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password 123456 \
    --table tb_url \
    --export-dir /user/hive/warehouse/tb_url \
    --input-fields-terminated-by '\t' \
    --update-key id \
    --update-mode updateonly \
    -m 1
    ```

    - `--update-key`：以哪一列的值作为判断

  - `--update-mode`：增量导出模式

#### 方式二：allowinsert

- **这种方式会增量导出更新的数据和增加的数据**

- 使用模板

  - 修改lateral.txt

    ```txt
    1       http://bigdata.domain.com/path/p1.php?query=1
    2       http://www.baidu.com/news/index.jsp?uuid=frank
    3       http://www.jd.com/index?source=baidu
    4       http://www.domain.com
    ```

  - 覆盖表中数据

    ```
    load data local inpath '/export/datas/lateral.txt' overwrite into table tb_url;
    ```

  - 增量导出

    ```
    sqoop export \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password 123456 \
    --table tb_url \
    --export-dir /user/hive/warehouse/tb_url \
    --input-fields-terminated-by '\t' \
    --update-key id \
    --update-mode allowinsert \
    -m 1
    ```


## Sqoop Job

- - 创建一个sqoop job

    ```shell
    sqoop job --create job01 \
    -- import \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password 123456 \
    --table tb_tohdfs \
    --target-dir /sqoop/import/test04 \
    --fields-terminated-by '\t' \
    --incremental append \
    --check-column id \
    --last-value 8 \
    -m 1
    ```

  - 查看所有的job

    ```shell
    sqoop job --list
    ```

  - 查看某个job的信息

    ```shell
    sqoop job --show job01
    ```

    - 注意：会让你输入Mysql的密码：123456

  - 执行一个Sqoop的Job

    ```shell
    sqoop job --exec job01
    ```

    - 注意：会让你输入Mysql的密码：123456

- 新的问题

  - Sqoop Job运行时，需要手动提供MySQL数据库密码，如何解决？

  - 方案一：修改Sqoop的配置文件，sqoop-site

    - 添加本地元数据存储密码的配置

  - 方案二：将MySQL密码存储在一个文件中，在程序中指定这个文件的位置

    ```shell
    sqoop job --create job01 \
    -- import \
    --connect jdbc:mysql://hadoop01:3306/sqoopTest \
    --username root \
    --password-file   /export/datas/sqooppasswd.txt \
    --table tb_tohdfs \
    --target-dir /sqoop/import/test04 \
    --fields-terminated-by '\t' \
    --incremental append \
    --check-column id \
    --last-value 8 \
    -m 1
    ```

    - --password-file：将密码存在文件中，这个文件默认HDFS地址，/export/datas/sqooppasswd.txt

    - 注意：这个文件必须只有一行，就是密码，必须手动将第二行删掉

      - 创建

        ```
        123456
        
        ```

      - 删掉第二行换行