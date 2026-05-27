# [Hive]在指定位置添加字段

- 1、先在末尾添加字段
- 2、再把字段移动到合适的位置

~~~SQL
alter table table_name add columns (c_time string comment '当前时间'); -- 正确，添加在最后
alter table table_name change c_time c_time string after address ;  -- 正确，移动到指定位置,address字段的后面
~~~

