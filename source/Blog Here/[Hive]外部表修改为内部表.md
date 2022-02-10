# [Hive]外部表修改为内部表

有时候需要删除Hive表的某个分区，然后重新写入数据，但由于被操作的表为外部表，所以操作不成功，这个时候没有过多的安全考虑，可以将外部表修改为内部表，其操作如下：

~~~sql
ALTER TABLE TABLE_NAME SET TBLPROPERTIES ('EXTERNAL'='FALSE');
~~~



操作前使用

~~~sql
DESCRIBE FORMATTED TABLE_NAME;
~~~

查看表的属性中`Table Type`为`EXTERNAL_TABLE`,操作后为`MANAGED_TABLE `

