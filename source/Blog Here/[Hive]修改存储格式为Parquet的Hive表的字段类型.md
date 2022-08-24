# [Hive]修改存储格式为Parquet的Hive表的字段类型

现在需要将一个Hive表的原先为INT类型的字段修改为STRING类型

1、使用impala进行修改

~~~sql
ALTER TABLE db.table_name CHANGE culumn_a culumn_a INT COMMENT '测试样例字段' ;
~~~

2、使用Hive CLI进行修改

~~~SQL
ALTER TABLE db.table_name CHANGE culumn_a culumn_a INT COMMENT '测试样例字段' CASCADE;
~~~

使用以上两种方式进行修改，都可以修改成功，并且通过`DESCRIBE`进行查看表结构时也可以看到表结构成功进行了修改，到了这里仿佛胸有成竹，一切都那么顺利，可是在进行读取该表数据的时候，情况不妙了，数据并不能进行读取，无论是使用impala，还是hive CLI还是spark，都报错了：

~~~java
---IMPALA报错样例
File 'hdfs://nameservice1/user/hive/warehouse/dw_csvw.db/dim_charging_connector_security/dt=2022-01-01/part-00003-62077880-573a-41e9-815b-f0fa15779c56-c000' has an incompatible Parquet schema for column 'dw_csvw.dim_charging_connector_security.connector_national_standard'. Column type: STRING, Parquet schema: optional int32 connector_national_standard [i:9 d:1 r:0]
~~~

可以推测，Hive的元数据和内部表和外部表对于数据的关系是类似的，元数据和HDFS的文件数据是分离的。为了修复这种错误，只要将字段类型修改回去就可以了。

尝试到这里，已经没有什么渐变的方法可以修改存储格式为parquet的Hive表的字段类型，于是只能通过新建一张临时表，将数据全部导入到临时表，再转换类型导回去，或者直接删除旧表，新的临时表建立合适的字段类型，再修改表明。



