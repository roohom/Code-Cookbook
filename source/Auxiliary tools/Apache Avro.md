# Apache Avro

> Avro是Hadoop的子项目，是高性能的数据传输中间件。Avro可以做到将数据进行序列化，适用于远程或本地大批量数据交互。在传输的过程中Avro对数据二进制序列化后节约数据存储空间和网络传输带宽。

## Why we choose Avro

- 优点：
  - 数据结构丰富
    - 8中基本类型
    - 6中复杂类型：**records**，enums, map, union等
  - 数据格式友好：json
  - 序列化数据传输和存储（字节类型）
    - 节省网络带宽，提高数据磁盘的读写性能
      - 为什么节省带宽？
        - 一部分是因为schema(约束)，一部分是数据体
      - 如何提高读写性能？
        - 数据是序列化数据

## 数据类型

### 原生类型

- null: 表示没有值

- boolean: 表示一个二进制布尔值

- int: 表示32位有符号整数

- long: 表示64位有符号整数

- float: 表示32位的单精度浮点数
- double: 表示64位双精度浮点数
- bytes: 表示8位的无符号字节序列
- string: Unicode 编码的字符序列

>  总共就这8种原生数据类型，这些原生数据类型均没有明确的属性。

### 复杂数据类型

> AVRO支持6种复杂类型，分别是：records, enums, arrays, maps, unions，fixed

Records

- 此数据结构内部字段可以由多种基本类型组成
- 必选属性
  - name：文件名
  - type：类型指定（records）
  - fields：具体字段，可以包含多个字段（此字段是一个数组）
    - 包含属性字段：
      - name：字段名
      - type：定义Schema的一个JSON对象，或者是命名一条记录定义的JSON string
- 非必选属性：
  - namespace：是一个JSON String命名空间，定义文件路径
  - doc：是一个JSON String，为使用这个Schema的用户提供文档
  - aliases: 是JSON的一个string数组，为这条记录提供别名

Enums

> Enums使用的名为“enum”的type并且支持如下的属性：

- name: 必有属性，是一个JSON string，提供了enum的名字。

- namespace，也是一个JSON string，用来限定和修饰name属性。

- aliases: 可选属性，是JSON的一个string数组，为这个enum提供别名。

- doc: 可选属性，是一个JSON string，为使用这个Schema的用户提供文档。

- symbols: 必有属性，是一个JSON string数组，列举了所有的symbol，在enum中的所有symbol都必须是唯一的，不允许重复。比如下面的例子：

~~~
引用
{ "type": "enum",
"name": "Person",
"symbols" : ["name", "age", "address", "sex"]
}
~~~



Enums使用的名为“enum”的type并且支持如下的属性：

name: 必有属性，是一个JSON string，提供了enum的名字。

namespace，也是一个JSON string，用来限定和修饰name属性。

aliases: 可选属性，是JSON的一个string数组，为这个enum提供别名。

doc: 可选属性，是一个JSON string，为使用这个Schema的用户提供文档。

symbols: 必有属性，是一个JSON string数组，列举了所有的symbol，在enum中的所有symbol都必须是唯一的，不允许重复。比如下面的例子：

引用

{ "type": "enum",

"name": "Person",

"symbols" : ["name", "age", "address", "sex"]

}

Arrays

> Array使用名为"array"的type，并且支持一个属性

- items: array中元素的Schema

  > 比如一个string的数组声明为：
  >
  > 引用
  >
  > {"type": "array", "items": "string"}

  

Maps

Map使用名为"map"的type，并且支持一个属性

- values: 用来定义map的值的Schema。Maps的key都是string。比如一个key为string，value为long的maps定义为：

> 引用
>
> {"type": "map", "values": "long"}



Unions

Unions就像上面提到的，使用JSON的数组表示。比如:

> 引用
>
> ["string", "null"]

声明了一个union的Schema，其元素即可以是string，也可以是null。

> Unions不能包含多个相同类型的Schema，除非是命名的record类型、命名的fixed类型和命名的enum类型。比如，如果unions中包含两个array类型，或者包含两个map类型都不允许；但是两个具有不同name的相同类型却可以。由此可见，union是通过Schema的name来区分元素Schema的，因为array和map没有name属性，当然只能存在一个array或者map。（使用name作为解析的原因是这样做会使得读写unions更加高效）。unions不能紧接着包含其他的union。



Fixed

- Fixed类型使用"fixed"的type name，并且支持三个属性：

- name: 必有属性，表示这个fixed的名称，JSON string。

- namespace:也是一个JSON string，用来限定和修饰name属性。

- aliases: 可选属性，同上

- size: 必选属性，一个整数，志明每个值的字节数。

> 比如16字节的fixed可以声明为：
>
> 引用
>
> {"type": "fixed", "size": 16, "name": "md5"}



- Record, enums 和 fixed都是命名的类型，这三种类型都各有一个全名，全名有两部分组成：名称和命名空间。名称的相等是定义在全名基础上的。

- 全名的名字部分和record的field名字必须：

  > 以[A-Za-z_]开头
  > 接下来的名字中只能包含[A-Za-z0-9_]

- namespace是以点分隔的一系列名字。

- 在record、enum和fixed的定义中，全名由以下的任意一条决定：

  > 同时指定name和namespace，比如使用 "name": "User", "namespace": "me.iroohom"来表示全名me.iroohom.User。
  >
  > 指定全名
  >
  > - 如果name中包含点号，则认为是全名。比如用 "name": "org.foo.X" 表示全名org.foo.X。
  >
  > 仅仅指定name，name中没有点号
  >
  > - 在这种情况下命名空间取自距离最近的父亲的Schema或者protocol。比如声明了"name": "X"， 这段声明在一条记录“org.foo.Y”的field中，那么X的全名就是org.foo.X。
  >
  > 原生类型没有命名空间，并且不可以在命名空间中定义原生类型。

## How to use Avro

- 1、首先需要在maven中引入依赖：

  ~~~xml
  <dependencies>
      <dependency>
          <groupId>org.apache.avro</groupId>
          <artifactId>avro</artifactId>
          <version>1.8.1</version>
      </dependency>
  </dependencies>
  ~~~

  

- 2、其次需要在maven中配置Avro编译插件

  ~~~xml
  <plugins>
          <!--maven编译插件-->
          <plugin>
              <groupId>org.apache.maven.plugins</groupId>
              <artifactId>maven-compiler-plugin</artifactId>
              <configuration>
                  <source>1.8</source>
                  <target>1.8</target>
              </configuration>
          </plugin>
          <!--Avro编译插件-->
          <plugin>
              <groupId>org.apache.avro</groupId>
              <artifactId>avro-maven-plugin</artifactId>
              <version>1.8.1</version>
              <executions>
                  <execution>
                      <phase>generate-sources</phase>
                      <goals>
                          <goal>schema</goal>
                      </goals>
                      <configuration>
                          <!--Avro源文件-->
                          <sourceDirectory>${project.basedir}/src/main/avro/</sourceDirectory>
                          <!--Avro编译生成文件-->
                          <outputDirectory>${project.basedir}/src/main/java/</outputDirectory>
                      </configuration>
                  </execution>
              </executions>
          </plugin>
      </plugins>
  </build>
  ~~~

- 3、在我们的项目中引入`.avsc`文件，也就是放在步骤2中的`sourceDirectory`中的路径中

  ~~~json
  {"namespace": "me.roohom.avro",
   "type": "record",
   "name": "User",
   "fields": [
       {"name": "name", "type": "string"},
       {"name": "age",  "type": ["int", "null"]},
       {"name": "address", "type": ["string", "null"]}
   ]
  }
  ~~~

  

- 4、在项目中使用maven进行编译，此时，会在步骤2中的`outputDirectory`中生成我们的model类的代码。

- 5、序列化一个对象：

  ~~~java
  //新建对象
  User user = new User();
  
  //封装数据
  user.setName("Allen");
  user.setAge(22);
  user.setAddress("安徽");
  
  User anoUser = new User("xx", 19, "北京");
  User thirdUser = User.newBuilder()
          .setName("aa")
          .setAge(20)
          .setAddress("西安")
          .build();
  
  //序列化 定义模式
  SpecificDatumWriter<Object> datumWriter = new SpecificDatumWriter<>(user.getSchema());
  
  //数据序列化对象
  DataFileWriter<Object> dataFileWriter = new DataFileWriter<>(datumWriter);
  
  //设置序列化文件路径
  dataFileWriter.create(user.getSchema(), new File("avro.txt"));
  
  dataFileWriter.append(user);
  dataFileWriter.append(anoUser);
  dataFileWriter.append(thirdUser);
  
  dataFileWriter.close();
  ~~~

- 6、从持久化文件中反序列化一个对象

  ~~~java
  //反序列化
  SpecificDatumReader<User> datumReader = new SpecificDatumReader<>(User.class);
  DataFileReader dataFileReader = new DataFileReader<User>(new File("avro.txt"), datumReader);
  for (Object users : dataFileReader) {
      System.out.println("反序列化" + users);
  }
  ~~~

  当然，也可以使用更通用的办法去反序列化，而不需要指定具体的model类，让avro自己去推断解析schema

  ~~~java
  File file = new File("avro.txt");
  File schemaFile = new File("src/main/avro/user.avsc");
  Schema schema = new Schema.Parser().parse(schemaFile);
  
  //反序列化
  SpecificDatumReader<GenericData> datumReader = new SpecificDatumReader<>(schema);
  DataFileReader<GenericData> dataFileReader = new DataFileReader<GenericData>(file, datumReader);
  for (Object db : dataFileReader) {
      System.out.println("反序列化:" + db);
  }
  ~~~

  

## How to use Avro with Kafka

当我们需要将数据使用avro序列化框架序列化之后发送到Kafka时，就需要自定义序列化器，使用下面的办法可以自定义序列化器，在向kafka发送数据的时候使用：

~~~java
/**
 * @ClassName: AvroSerializer
 * @Author: Roohom
 * @Function: 自定义序列化
 * @Date: 2020/10/28 17:32
 * @Software: IntelliJ IDEA
 */
public class AvroSerializer<T extends SpecificRecordBase> implements Serializer<T> {
    //泛型参数继承avro基类，实现序列化接口
    
    @Override
    public void configure(Map<String, ?> configs, boolean isKey) {

    }

    /**
     * 仅需要复写此方法即可以实现自定义序列化
     *
     * @param topic Kafka topic
     * @param data  数据
     * @return 输出流字节数组
     */
    @Override
    public byte[] serialize(String topic, T data) {
        //设置Schema约束对象
        SpecificDatumWriter<Object> datumWriter = new SpecificDatumWriter<>(data.getSchema());
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        BinaryEncoder binaryEncoder = EncoderFactory.get().directBinaryEncoder(outputStream, null);
        try {
            //通过write方法，会将avro类型的数据，编码成字节流，数据会存储在outputStream字节输出流对象中
            datumWriter.write(data, binaryEncoder);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return outputStream.toByteArray();
    }

    @Override
    public void close() {
    }
}
~~~

下面一个kafka生产者实例，在properties中声明了值的序列化器：

~~~java
public class KafkaPro<T extends SpecificRecordBase> {
    public Properties getProperties() {
        Properties properties = new Properties();
        properties.put("bootstrap.servers", "localhost:9092");
        properties.put("acks", "0");
        properties.put("retries", "0");
        properties.put("batch.size", "16384");
        properties.put("linger.ms", "1");
        properties.put("buffer.memory", "33554421");
        properties.put("key.serializer", StringSerializer.class.getName());
        properties.setProperty("value.serializer", AvroSerializer.class.getName());

        return properties;
    }
    /**
     * 获取kafka生产者对象
     */
    KafkaProducer<String, T> producer = new KafkaProducer<>(getProperties());
    public void sendData(String topic, T data) {
        producer.send(new ProducerRecord(topic, data));
    }
}
~~~

## How to use Avro with Flink

使用Flink消费kafka数据

~~~java
Properties properties = new Properties();
properties.setProperty("bootstrap.servers", "localhost:9092");
properties.setProperty("group.id", "test");
DataStream<String> stream = env
	.addSource(new FlinkKafkaConsumer<>("topic", new SimpleStringSchema(), properties));
~~~

上面的实例需要指定一个`DeserializationSchema`，当数据为avro格式的数据时需要指定为`AvroDeserializationSchema`

Schema可以通过从Avro自动生成的class中推测得到，也可以通过使用GenericRecords和手动提供的Schema配合来得到

比如：

~~~java
AvroDeserializationSchema<User> UserSchema = AvroDeserializationSchema.forSpecific(User.class);
~~~

maven中需要引入

~~~xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-avro</artifactId>
    <version>1.12.3</version>
</dependency>
~~~



当采用了Avro序列化框架将数据序列化后存储在Kafka之后，采用Flink消费kafka的topic数据的时候，可以自定义Schema去消费解析数据

~~~java
public class AvroDeserializationSchema<T> implements DeserializationSchema<T> {
    private String topicName;

    public AvroDeserializationSchema(String topicName) {
        this.topicName = topicName;
    }
    @Override
    public T deserialize(byte[] message) throws IOException {
        //定义反序列化约束对象
        SpecificDatumReader<T> avroSchema = new SpecificDatumReader(XXX.class)
        //获取反序列化编码对象
        ByteArrayInputStream bis = new ByteArrayInputStream(message);
        //二进制对象
        BinaryDecoder binaryDecoder = DecoderFactory.get().binaryDecoder(bis, null);

        T read = avroSchema.read(null, binaryDecoder);
        return read;
    }
    @Override
    public boolean isEndOfStream(T nextElement) {
        return false;
    }
    @Override
    public TypeInformation<T> getProducedType() {
        TypeInformation<T> of = (TypeInformation<T>) TypeInformation.of(XXX.class);
        return of;
    }
}
~~~

