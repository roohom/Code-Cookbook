# FlinkSQL时间处理函数

## 前言

FlinkSQL官网的SQL 关于时间处理的Functions的[介绍](https://nightlies.apache.org/flink/flink-docs-release-1.15/docs/dev/table/functions/systemfunctions/#temporal-functions)

## Examples

- 字符串日期转换成时间戳

  ~~~sql
  SELECT TO_TIMESTAMP('2022-09-06', 'yyyy-MM-dd') AS tim;
  ~~~

- 时间戳日期转换成字符串日期

  ~~~sql
  SELECT DATE_FORMAT(NOW(), 'yyyy-MM-dd') AS dt;
  ~~~

- 获取明天的日期

  ~~~sql
  SELECT DATE_FORMAT(TIMESTAMPADD(DAY, 1, CURRENT_TIMESTAMP), 'yyyy-MM-dd') AS tomorrow;
  ~~~

- 获取任意日期的次日

  ~~~sql
  SELECT DATE_FORMAT(TIMESTAMPADD(DAY, 1, TO_TIMESTAMP('2022-01-01','yyyy-MM-dd')), 'yyyy-MM-dd') AS tomorrow;
  ~~~

- 对任意日期加任意天

  ~~~sql
  SELECT DATE_FORMAT(TIMESTAMPADD(DAY, ${days}, TO_TIMESTAMP(${date},'yyyy-MM-dd')), 'yyyy-MM-dd') AS tomorrow;
  ~~~

- 任意日期加一周

  ~~~sql
  SELECT DATE_FORMAT(TIMESTAMPADD(WEEK, 1, TO_TIMESTAMP('2022-01-01','yyyy-MM-dd')), 'yyyy-MM-dd') AS dt;
  ~~~

- 任意日期加一个月

  ~~~sql
  SELECT DATE_FORMAT(TIMESTAMPADD(MONTH, 1, TO_TIMESTAMP('2022-01-01','yyyy-MM-dd')), 'yyyy-MM-dd') AS dt;
  ~~~

- 任意日期加一年

  ~~~sql
  SELECT DATE_FORMAT(TIMESTAMPADD(YEAR, 1, TO_TIMESTAMP('2022-01-01','yyyy-MM-dd')), 'yyyy-MM-dd') AS dt;
  ~~~

- 获取指定日期所属月份的最后一天

  > 可实现，较繁琐

- 获取指定日期所属月份的第一天

  > 可实现，较繁琐

  