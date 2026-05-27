# [SQL]计算指定日期的**年-周**(为某年的第多少周)

在ETL加工时，有时候需要计算指定日期为今年的第多少周，并且要在周前面带上年份，具有一定的分析意义。比如`2021-01-01`就为2020年的第53周，结果就应该为2020-53。

下面介绍如何得到该结果。



### 方法一：

~~~sql
SELECT
IF(
                               WEEKOFYEAR(latest_confirm_time) >= 52,
                               CONCAT_WS('-', CAST(YEAR(DATE_ADD(latest_confirm_time, -365)) AS STRING), CAST(WEEKOFYEAR(latest_confirm_time) AS STRING)),
                               CONCAT_WS('-',
                                         CAST(YEAR(latest_confirm_time) AS STRING),
                                         CAST(IF(WEEKOFYEAR(latest_confirm_time) < 10, CONCAT_WS('', '0', CAST(WEEKOFYEAR(latest_confirm_time) AS STRING)), CAST(WEEKOFYEAR(latest_confirm_time) AS STRING)) AS STRING)
                                   )
                       )                                                   AS year_week
~~~

上面使用复杂的套用，先判断指定的日期是否为年末最后一周，因为这一周会涉及到跨年，如果不是直接计算年周，如果是的话重新计算年和周，以匹配跨年的情况，以上使用SparkSQL正常计算。将dt替换为`2021-01-01`可以得到`2020-53`



### 方法二：

~~~sql
select concat(cast(year(date_sub(next_day(${dt}, 'MO'), 4)) AS string),'-', cast(weekofyear(${dt}) as string)) AS year_week; 
~~~

该方法先将指定日期重置为当周的周一，然后再得到该周周四的日期，因为一周中周四为中间日期，跨年的情况刚好可以用周四来定义该周所属的年份，因为一周七天，哪年占的天数多，该周就属于哪年，所以周四所属的年份即为我们需要的年份。然后再将年和周进行拼接，即得到了我们所要的年周。以上结果同样达到我们的需求。