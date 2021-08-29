# [Kudu]关于Kudu列的顺序的修改

## 时间紧？直接说结果：

Kudu是列式存储，其表字段的顺序并没有RDBMS那么严格，其字段在Impala上查看会有一个顺序，并且无法修改，也不需要修改，数据写入时，会自动去匹配，前提是你有一个按照对应字段写入数据的计算能力。



## 电量充足，展开说说：

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

需要同步到Kudu中，名为B_kudu。

现在需要将这两个表的数据联合，由于项目Flink同步程序的功能的不支持（每次同步生成的结果表不能一致，并且源表A和B表表名其实一致，但A表比B表少一个字段，实际情景是A表已经同步完成并且A_kudu已经得到，再为B专门同步一次，链路过长，操作过多，耗时较长），所以需要涉及到修改新增kudu的列，让启动Flink消费kafka（DML任务）的程序可以直接利用已经生成了的A_kudu表（DDL任务）而直接写入数据，办法是将A_kudu表新增`distinct_id`字段，并且置于`id`之后，和B_kudu保持一致，再启动B表的数据写入工作，直接写入到新增了列的A_kudu表中。此时，并没有生成B_kudu表，因为数据被写入到了新增了列的A_kudu表中。

> Flink同步数据的整个链路如下：
>
> MySQL -> debezium -> Kafka -> Flink -> Kudu
>
> 即：mysql的binlog被debezium实时捕获(CDC)，消息被打入到kafka中，Flink实时消费kafka解析消息写入到kudu中
>
> - 一部分是表结构的实时同步（DDL任务）
> - 另一部分是数据的实时同步，数据写入在表结构同步完成之后（DML任务）



办法有了，开始干！

先去impala上给kudu新增一个列，并且置于id之后，用熟知的`alter table xxx add columns(distinct_id bigint) after id`,好家伙，直接给报一个不支持，压根就没有after语法，

继续寻找办法，百度找一下，说kudu不支持after语法，是不支持将新增的列放在指定位置的，可是我看impala上展现的表结构是有顺序的啊。

我不信，继续寻找，于是去看了kudu的java api，看了一会儿也没发现什么操作可以修改列顺序。

我开始翻阅Apache Kudu官网，官网上有这样一段话：

> *Kudu takes advantage of strongly-typed columns and a columnar on-disk storage format to provide efficient encoding and serialization.*

这里说了，Kudu是列式存储，对啊，Kudu是列式存储啊，才想起来！

列式存储，那列的顺序岂不是已经不再像普通RDBMS那样重要了，直接干！

于是我直接通过impala在kudu表A_kudu中新增了`distinct_id`字段，并且启动B表的Flink DML任务，数据成功写入，这说名，Kudu是列式存储，列的顺序并不重要，列的顺序只是在impala上查看表结构时的一种呈现而已，在数据写入时，并不会因为字段顺序的变更而导致数据写入不了，这与RDBMS字段的顺序要求一致而不同。



又学到了。

