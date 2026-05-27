# [Spark]如何使用Java创建一个Row

## 背景

使用Java去调用Spark的API的时候，总是有一些不方便的地方，下面探讨一个自己实际遇到的问题，如何使用Spark的Java API去创建一个Row。



原来的需求是从一个Hive表中读取所有的数据，表中包含一列值为json的字段，要求解析该json数据拍平后落到另一张Hive表。我采用的方式是使用Spark读取源表数据得到一个DF，再使用FlatMap，在FlatMap里面解析json组装成多个Row后得到另一个Dataset\<Row\>，再赋予一个指定的Schema，创建最终DF，对其创建临时表，使用SparkSQL INSERT到结果表中。

以下的分析很大程度来源于Stackoverflow上的一个[问题](https://stackoverflow.com/questions/39696403/how-to-create-a-row-from-a-list-or-array-in-spark-using-java).

## 实施

### 方案一：Dataset\<Bean\>

这种方式没有把数据转换成Row，而是转换成Dataset\<Bean\>,即最强类型，直接创建临时表即可以开始使用SQL进行分析。

~~~java
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public static class User {
    private Integer id;
    private String name;
    private String bagBrand;
}

public static void main(String[] args) {
    SparkSession spark = SparkSession.builder()
        .appName("SparkSQLTransformTestLocal")
        .master("local[*]")
        .getOrCreate();
    ObjectMapper objectMapper = new ObjectMapper();
    Dataset<Row> sourceDF = spark.sql("SELECT 1 AS id, '{\"name\":\"jack\",\"prop\":[{\"id\":1,\"bag\":\"new balance\"},{\"id\":2,\"bag\":\"nike\"}]}' AS col");

    Dataset<User> userDataset = sourceDF.flatMap(
        (FlatMapFunction<Row, User>) row -> {
            ArrayList<User> users = new ArrayList<>();
            JsonNode jsonNode = objectMapper.readTree(row.get(1).toString());
            String name = jsonNode.get("name").asText();
            JsonNode props = jsonNode.get("prop");
            for (JsonNode prop : props) {
                User user = new User();
                Map<String, Object> map = objectMapper.readValue(prop.toString(), Map.class);

                user.setId(row.getInt(0));
                user.setName(name);
                user.setBagBrand(map.get("bag").toString());
                users.add(user);
            }
            return users.iterator();
        },
        Encoders.bean(User.class)
    );

    userDataset.createOrReplaceTempView("users");
    spark.sql("select * from users").show(false);


    spark.stop();
}
~~~



结果

~~~sql
+-----------+---+----+
|bagBrand   |id |name|
+-----------+---+----+
|new balance|1  |jack|
|nike       |1  |jack|
+-----------+---+----+
~~~

可以看到结果集的字段名就是Bean的属性名，带驼峰，我们在使用SQL的时候应该都不带驼峰。



### 方案二：Dataset\<Row\> + Schema

手动创建一个Row，并返回再指定一个schema即可得到一个DF，在此之上创建一个临时视图，即可使用SQL进行分析。

~~~java
public static void main(String[] args) {
    SparkSession spark = SparkSession.builder()
        .appName("SparkSQLTransformTestLocal")
        .master("local[*]")
        .getOrCreate();
    ObjectMapper objectMapper = new ObjectMapper();
    Dataset<Row> sourceDF = spark.sql("SELECT 1 AS id, '{\"name\":\"jack\",\"prop\":[{\"id\":1,\"bag\":\"new balance\"},{\"id\":2,\"bag\":\"nike\"}]}' AS col");
    ArrayList<StructField> structFields = new ArrayList<>();
    structFields.add(DataTypes.createStructField("id", DataTypes.IntegerType, true));
    structFields.add(DataTypes.createStructField("name", DataTypes.StringType, true));
    structFields.add(DataTypes.createStructField("bag_brand", DataTypes.StringType, true));
    StructType schema = DataTypes.createStructType(structFields);

    JavaRDD<Row> rowJavaRDD = sourceDF.toJavaRDD().flatMap(
        (FlatMapFunction<Row, Row>) row -> {
            ArrayList<Row> userRows = new ArrayList<>();
            JsonNode jsonNode = objectMapper.readTree(row.get(1).toString());
            String name = jsonNode.get("name").asText();
            JsonNode props = jsonNode.get("prop");
            for (JsonNode prop : props) {
                Map<String, Object> map = objectMapper.readValue(prop.toString(), Map.class);
                userRows.add(
                    RowFactory.create(
                        map.get("id"),
                        name,
                        map.get("bag").toString()
                    )
                );
            }
            return userRows.iterator();
        }
    );
    Dataset<Row> userDF = spark.createDataFrame(rowJavaRDD, schema);
    userDF.createOrReplaceTempView("users");

    spark.sql("select * from users").show(false);


    spark.stop();
}
~~~

结果：

~~~sql
+---+----+-----------+
|id |name|bag_brand  |
+---+----+-----------+
|1  |jack|new balance|
|2  |jack|nike       |
+---+----+-----------+
~~~

这种方式可以随意指定字段名，因为这包含在我们的schema中。



**升级**，以上的代码有很多冗余，并且可扩展性不强，我们对其进行稍加改造，提高其扩展性。

改动主要有两块：

- 1、将字段名和字段类型分别存储在List和Map中，方便使用循环去创建一个schema
- 2、将输出的Row所需要的字段存储在一个Object类型的数组中，使用循环赋值给数组，再作为参数去创建一个Row，大大简化代码

<u>对于第二点，也是我的新认识，`RowFactory.create(Object... values)`接收的是一个变长参数，由于之前一直不知道**变长参数其实就是一个数组**，所以一直不知道怎么去简化该部分的代码，于是就根据字段的个数，去一个一个赋值，所以导致结果表的字段有多少个，该方法的参数就有多少个，代码显得很冗长。</u>





~~~java
public static DataType getProperType(String columnType) {
    switch (columnType.toUpperCase()) {
        case "LONG":
        case "BIGINT":
            return DataTypes.LongType;
        case "FLOAT":
            return DataTypes.FloatType;
        case "DOUBLE":
            return DataTypes.DoubleType;
        case "BYTE":
        case "TINYINT":
        case "SMALLINT":
        case "INT":
            return DataTypes.IntegerType;
        case "BOOLEAN":
            return DataTypes.BooleanType;
        case "DATE":
        case "TIME":
        case "TIMESTAMP":
            return DataTypes.TimestampType;
        default:
            return DataTypes.StringType;
    }
}

public static void main(String[] args) {
    SparkSession spark = SparkSession.builder()
        .appName("SparkSQLTransformTestLocal")
        .master("local[*]")
        .getOrCreate();
    ObjectMapper objectMapper = new ObjectMapper();
    Dataset<Row> sourceDF = spark.sql("SELECT 1 AS id, '{\"name\":\"jack\",\"prop\":[{\"id\":1,\"bag\":\"new balance\"},{\"id\":2,\"bag\":\"nike\"}]}' AS col");

    ArrayList<StructField> structFields = new ArrayList<>();
    ArrayList<String> columnList = new ArrayList<>();
    columnList.add("id");
    columnList.add("name");
    columnList.add("bag_brand");

    HashMap<String, String> columnTypeMap = new HashMap<>();
    columnTypeMap.put("id", "INT");
    columnTypeMap.put("name", "STRING");
    columnTypeMap.put("bag_brand", "STRING");
    for (int i = 0; i < columnList.size(); i++) {
        String columnName = columnList.get(i);
        structFields.add(DataTypes.createStructField(columnName, getProperType(columnTypeMap.get(columnName)), true));
    }
    StructType schema = DataTypes.createStructType(structFields);

    JavaRDD<Row> rowJavaRDD = sourceDF.toJavaRDD().flatMap(
        (FlatMapFunction<Row, Row>) row -> {
            ArrayList<Row> userRows = new ArrayList<>();
            HashMap<String, Object> resultMap = new HashMap<>();

            JsonNode jsonNode = objectMapper.readTree(row.get(1).toString());
            String name = jsonNode.get("name").asText();
            resultMap.put("name", name);
            JsonNode props = jsonNode.get("prop");
            for (JsonNode prop : props) {
                Map<String, Object> map = objectMapper.readValue(prop.toString(), Map.class);
                resultMap.putAll(map);

                Object[] objects = new Object[columnList.size()];
                for (int i = 0; i < columnList.size(); i++) {
                    objects[i] = resultMap.get(columnList.get(i));
                }

                userRows.add(RowFactory.create(objects));
            }
            return userRows.iterator();
        }
    );
    Dataset<Row> userDF = spark.createDataFrame(rowJavaRDD, schema);
    userDF.createOrReplaceTempView("users");

    spark.sql("select * from users").show(false);


    spark.stop();
}
~~~

结果：

~~~sql
+---+----+-----------+
|id |name|bag_brand  |
+---+----+-----------+
|1  |jack|new balance|
|2  |jack|nike       |
+---+----+-----------+
~~~



## 总结

### 一：原始的方式

~~~java
StructType schemata = DataTypes.createStructType(
    new StructField[]{
        DataTypes.createStructField("NAME", DataTypes.StringType, false),
        DataTypes.createStructField("STRING_VALUE", DataTypes.StringType, false),
        DataTypes.createStructField("NUM_VALUE", DataTypes.IntegerType, false),
    });
Row r1 = RowFactory.create("name1", "value1", 1);
Row r2 = RowFactory.create("name2", "value2", 2);
ArrayList<Row> rowList = new ArrayList<>();
rowList.add(r1);
rowList.add(r2);

Dataset<Row> data = spark.createDataFrame(rowList, schemata);
data.show();
~~~

### 二：使用POJO

~~~java
List<MyData> mlist = new ArrayList<MyData>();
mlist.add(d1);
mlist.add(d2);

Row row = RowFactory.create(mlist.toArray()); 
~~~

### 三：Dataset转换得到

~~~java
List<MyDTO> dtoList = Arrays.asList(.....));
Dataset<MyDTO> dtoSet = sparkSession.createDataset(dtoList,
                Encoders.bean(MyDTO.class));
Dataset<Row> rowSet= dtoSet .select("col1","col2","col3");
~~~

