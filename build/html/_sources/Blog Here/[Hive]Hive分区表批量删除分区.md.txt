# [Hive]Hive分区表批量删除分区

有时候一个Hive的分区表存在大量的分区，需要删除部分一些分区(多个)，这个时候如果一个一个删除的话，就会耗费很长时间，就需要一个命令去批量删除Hive的分区，Hive提供了这样的命令：

~~~SQL
ALTER TABLE table_partitioned DROP PARTITION (dt>='2020-01-01',dt<='2021-01-01')
~~~

