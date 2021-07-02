# 关于Kudu列的顺序的修改

> 今天涉及到这样一个场景，我们的数仓乃至整个标签体系等用到的底层表，是通过Flink实时从MySQL中同步到Kudu中的，然后可以通过Impala构建即席查询，以及构建别的上层应用。

MySQL表A通过Flink同步到Kudu中，名为A_kudu,假如有以下字段

~~~sql
`id`,
`name`,
`age`
~~~

同时，有另外一个名为B的MySQL表，其表结构和A大致相同，如下：

~~~sql
`id`,
`distinct_id`,
`name`,
`age`
~~~

需要同步到Kudu中，名为B_kudu，现在需要将这两个表的数据联合，由于项目Flink同步程序的功能的不支持，所以需要同步，办法是将A_kudu表