# Java8 Stream API

本文严重参考自：[传送门1](https://blog.csdn.net/y_k_y/article/details/84633001)

读书人的事怎么能叫抄呢？

[传送门2](https://blog.csdn.net/mu_wind/article/details/109516995)

> Stream 是 Java8 中处理集合的关键抽象概念，它可以指定你希望对集合进行的操作，可以执行非常复杂的查找、过滤和映射数据等操作。使用Stream API 对集合数据进行操作，就类似于使用 SQL 执行的数据库查询。也可以使用 Stream API 来并行执行操作。简而言之，Stream API 提供了一种高效且易于使用的处理数据的方式。



## 操作分类

~~~mermaid
graph LR
中间操作 --> 无状态
无状态 --> unordered
无状态 --> filerter
无状态 --> map
无状态 --> mapToInt
无状态 --> flatMap
无状态 --> ...
中间操作 --> 有状态 
有状态 --> distinct
有状态 --> sorted
有状态 --> limit

结束操作 --> 非短路操作
结束操作 --> 短路操作
非短路操作 --> forEach
非短路操作 --> reduce
非短路操作 --> collect
非短路操作 --> max
非短路操作 --> count
短路操作 --> antMatch
短路操作 --> allMatch
短路操作 --> findFirst
~~~

> 无状态：指元素的处理不受之前元素的影响
>
> 有状态：指该操作只有拿到所有元素之后才能继续下去。
> 非短路操作：指必须处理所有元素才能得到最终结果；
> 短路操作：指遇到某些符合条件的元素就可以得到最终结果，如 A || B，只要A为true，则无需判断B的结果



## 实际操作

- 来个简单的

  ~~~java
  Stream<Integer> stream = Stream.of(6, 4, 6, 7, 3, 9, 8, 10, 12, 14, 14);
   
  Stream<Integer> newStream = stream
                  .filter(s -> s > 5) //6 6 7 9 8 10 12 14 14
                  .distinct() //6 7 9 8 10 12 14
                  .skip(2) //9 8 10 12 14
                  .limit(2); //9 8
  newStream.forEach(System.out::println);
  ~~~

- map与flatMap

  ~~~java
  List<String> list = Arrays.asList("a,b,c", "1,2,3");
   
  //将每个元素转成一个新的且不带逗号的元素
  Stream<String> s1 = list.stream().map(s -> s.replaceAll(",", ""));
  s1.forEach(System.out::println); // abc  123
   
  Stream<String> s3 = list.stream().flatMap(s -> {
      //将每个元素转换成一个stream
      String[] split = s.split(",");
      Stream<String> s2 = Arrays.stream(split);
      return s2;
  });
  s3.forEach(System.out::println); // a b c 1 2 3
  ~~~

- peek：如同于map，能得到流中的每一个元素。但map接收的是一个Function表达式，有返回值；而peek接收的是Consumer表达式，没有返回值。

  ~~~java
  Student s1 = new Student("aa", 10);
  Student s2 = new Student("bb", 20);
  List<Student> studentList = Arrays.asList(s1, s2);
   
  studentList.stream()
          .peek(o -> o.setAge(100))
          .forEach(System.out::println);   
   
  //结果：
  Student{name='aa', age=100}
  Student{name='bb', age=100} 
  ~~~

- reduce,Optional<T> reduce(BinaryOperator<T> accumulator)：第一次执行时，accumulator函数的第一个参数为流中的第一个元素，第二个参数为流中元素的第二个元素；第二次执行时，第一个参数为第一次函数执行的结果，第二个参数为流中的第三个元素；依次类推。

  ~~~java
  //经过测试，当元素个数小于24时，并行时线程数等于元素个数，当大于等于24时，并行时线程数为16
  List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24);
   
  Integer v = list.stream().reduce((x1, x2) -> x1 + x2).get();
  System.out.println(v);   // 300
   
  Integer v1 = list.stream().reduce(10, (x1, x2) -> x1 + x2);
  System.out.println(v1);  //310
   
  Integer v2 = list.stream().reduce(0,
          (x1, x2) -> {
              System.out.println("stream accumulator: x1:" + x1 + "  x2:" + x2);
              return x1 - x2;
          },
          (x1, x2) -> {
              System.out.println("stream combiner: x1:" + x1 + "  x2:" + x2);
              return x1 * x2;
          });
  System.out.println(v2); // -300
   
  Integer v3 = list.parallelStream().reduce(0,
          (x1, x2) -> {
              System.out.println("parallelStream accumulator: x1:" + x1 + "  x2:" + x2);
              return x1 - x2;
          },
          (x1, x2) -> {
              System.out.println("parallelStream combiner: x1:" + x1 + "  x2:" + x2);
              return x1 * x2;
          });
  System.out.println(v3); //197474048
  ~~~

## 上才艺

现在有一个写建表语句的需求，如果一个一个写，很麻烦且不优雅，那么可以通过如下方式实现：废话不多说了，直接上才艺

- 制造数据

  ~~~java
  @Getter
  @Setter
  @AllArgsConstructor
  public static class Field {
      private String filedName;
      private String filedType;
  }
  
  ArrayList<Field> fields = new ArrayList<>();
  fields.add(new Field("id", "int"));
  fields.add(new Field("name", "string"));
  fields.add(new Field("age", "int"));
  fields.add(new Field("school", "string"));
  ~~~

- 插播一种操作，将list转换为map

  ~~~java
  //通过Collectors.toMap方法将装有bean的list转换为map
  Map<String, String> fieldMap = fields.stream().collect(Collectors.toMap(Field::getFiledName, Field::getFiledType));
  ~~~

- 将上面的map打印。基础操作

  ~~~java
  //普通版
  fieldMap.forEach(new BiConsumer<String, String>() {
      @Override
      public void accept(String s, String s2) {
          System.out.println(s + " -> " + fieldMap.get(s));
      }
  });
  
  school -> string
  name -> string
  id -> int
  age -> int
  ~~~

- lambda版

  ~~~java
  //lambda版
  fieldMap.forEach(
          (String s, String s2) -> System.out.println(s + " -> " + fieldMap.get(s))
  
  );
  
  school -> string
  name -> string
  id -> int
  age -> int
  ~~~

- 封装一个建表语句出来，重点

  ~~~java
  //创建与上述map中对应的字段的一个表 create table
  //上才艺
  String sql = "CREATE TABLE IF NOT EXISTS TEST_TABLE ( \n";
  String fieldsString = fields.stream()
          .distinct()
          .map(x -> x.getFiledName() + " " + x.getFiledType().toUpperCase())
          .reduce((x, y) -> x + ",\n" + y)
          .orElse("");
  sql += fieldsString;
  sql += "\n) PARTITION BY(dt STRING) STORED AS parquet";
  System.out.println(sql);
  ~~~

  输出：

  > ```
  > /**
  >  * CREATE TABLE IF NOT EXISTS TEST_TABLE (
  >  * id INT,
  >  * name STRING,
  >  * age INT,
  >  * school STRING
  >  * ) PARTITION BY(dt STRING) STORED AS parquet
  >  */
  > ```











