# 将Spark DataFrame中的数值取出

有时候经过Spark SQL计算得到的结果往往就一行，而且需要将该结果取出，作为字符串参与别的代码块的判断条件，所以就需要将DF中的一行数据取出并且转换为String，下面探讨的是用一些办法实现该需求，分别有java和scala实现。

## Java代码

使用DF的takeAsList方法或者先转换为JavaRDD再使用collect方法

~~~java
    @Test
    public void collectTest(){
        SparkSession spark = SparkSession.builder()
                .master("local[2]")
                .getOrCreate();

        //转换为list，里面为rows，取出第一个row再取出值为String
        Dataset<Row> df = spark.sql("SELECT 'AHA' AS TEXT");
        List<Row> rows = df.takeAsList(1);
        System.out.println(rows.get(0).getString(0));

        //转换为javaRDD，再取出第一个row再取出值为String
        List<Row> collect = df.javaRDD().collect();
        String string = collect.get(0).getString(0);
        System.out.println(string);

        spark.stop();
~~~

## Scala代码

举个栗子🌰，以下方法直接使用collect方法

~~~JAVA
def isWorkDay(sparkSession: SparkSession, properties: Properties, date: String): Boolean = {
    val result = sparkSession.sql(
      s"""
        |select case date_type when 0 then true else false end
        |from 日期表
        |""".stripMargin).collect()
    if (result.length == 0) {
      true
    } else {
      result(0).getBoolean(0)
    }
  }
~~~

