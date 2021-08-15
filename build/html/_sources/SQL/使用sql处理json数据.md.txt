# 使用sql处理json数据

> 在impala和hive中都有`get_json_object`函数

当表中有json数据需要处理，提取出其中的某个键对应的值的时候，可以使用`get_json_object()`函数来处理



## IMPALA

- 解析单个json字符串

  ~~~sql
  select get_json_object('{"a":"123", "b": "456"}', '$.a')
  -- 123
  
  select get_json_object('{"a":"123", "b": "456"}', '$.b')
  -- 456
  ~~~

- 解析多个json字符串

  ~~~sql
  select get_json_object('[{"a":"123", "b": "456"},{"a":"23", "b": "56"}]', '$[0].a')
  -- 123
  
  select get_json_object('[{"a":"123", "b": "456"},{"a":"23", "b": "56"}]', '$[1].a')
  -- 23
  ~~~

- 当 json 字符串中存在 `$` 标志符，可用 `replace` 先替换成空，再进行值的提取

  ~~~sql
  select get_json_object(replace('{"$a":"123", "$b": "456"}', '$', ''), '$.a')
  -- 123
  ~~~

## HIVE

有这样一个json字符串

~~~json
data =
{
 "store":
        {
         "fruit":[{"weight":8,"type":"apple"}, {"weight":9,"type":"pear"}],  
         "bicycle":{"price":19.95,"color":"red"}
         }, 
 "email":"amy@only_for_json_udf_test.net", 
 "owner":"amy" 
}
~~~

- 解析单层值

  ~~~sql
  select get_json_object(data, '$.owner') from test;
  结果：amy
  ~~~

- 解析多层值

  ~~~sql
  select get_json_object(data, '$.store.bicycle.price') from test;
  结果：19.95
  ~~~

- 取出数组值

  ~~~sql
  select get_json_object(data, '$.store.fruit[0]') from test;
  结果：{"weight":8,"type":"apple"}
  ~~~

## SPARK

> 初次之外，spark还有别的处理json的函数，[详见官网](http://spark.apache.org/docs/latest/sql-ref-functions-builtin.html)

~~~sql
-- get_json_object
SELECT get_json_object('{"a":"b"}', '$.a');
+-------------------------------+
|get_json_object({"a":"b"}, $.a)|
+-------------------------------+
|                              b|
+-------------------------------+
~~~





