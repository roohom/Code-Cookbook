# [Flink]自定义序列化消费Kafka数据

Flink提供了开箱即用的API去消费Kafka数据，比如：

~~~java
FlinkKafkaConsumer<String> flinkKafkaConsumer = new FlinkKafkaConsumer<>(topicName,
        new SimpleStringSchema(),
        properties
);
env.addSource(flinkKafkaConsumer)
        .setParallelism(1)
        .print();
~~~

这里使用了`SimpleStringSchema`去解析kafka中的数据。有时候我们的上游数据存储在Kafka中，如果数据类型不为String，已经有的方法已经不适合解析我们的数据，这个时候我们就需要自定义schema去解析，下面讨论一个简单的自定义schema方法去解析数据的demo。



如果我们需要去自定义反序列化kafka中数据的方法，那么我们可以实现`KafkaDeserializationSchema`接口，在`deserialize`中定义了我们如何去处理解析每一条数据，`TypeInformation`表示了输出的数据的类型,下面给出一个案例：

> 存储在kafka中的数据为二进制类型(采用MessagePack序列化与反序列化，这其实与本案例无关)，自定义读取之后将其转换为json字符串

~~~java
public class UserKafkaDeserializeSchema implements KafkaDeserializationSchema<String> {

    @Override
    public boolean isEndOfStream(String s) {
        return false;
    }

    @Override
    public String deserialize(ConsumerRecord<byte[], byte[]> record) throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        TDMessage tdMessage = (TDMessage) new ObjectInputStream(new ByteArrayInputStream(record.value())).readObject();
        EventPackage eventPackage = (EventPackage) new ObjectInputStream(new ByteArrayInputStream((byte[]) tdMessage.getData())).readObject();
        return objectMapper.writeValueAsString(eventPackage);

    }

    @Override
    public TypeInformation<String> getProducedType() {
        return TypeInformation.of(String.class);
    }
}
~~~

