# [Flink]FlinkKafkaProducer启用压缩

> 一个Producer启用压缩的讨论：https://github.com/confluentinc/confluent-kafka-dotnet/issues/1455
>
> kafka的压缩机制：https://www.yangbing.fun/2022/04/30/compression-mechanism-of-the-Kafka-message/



### 背景

在进行某应用的压测时，上游将数据写入kafka，这边同步使用flink消费kafka，需要监控环境入口和出口的流量，以及消费的速率。

### 情况

上游将数据(protobuf格式)写入kafka，这边在同步消费时发现带宽明显比上游要高，排查发现上游在Producer写入kafka时配置了自动压缩的参数：compression.type=gzip



在flink消费kafka时，由于FlinkKafkaConsumer使用的是kafka的client，所以在消费kafka时会将已经压缩的数据自动解压，如果想要减少带宽，提高性能，同样可以在FlinkKafkaProducer配置压缩，将数据写入下游kafka

~~~java
Properties properties = new Properties();
        properties.put("bootstrap.servers", "brokers:9092");
        properties.put("compression.type", "gzip");
        properties.put("compression.codec", "gzip");



        //创建kafka producer
        return new FlinkKafkaProducer<>(
                "rtg_non_geo_data_svw",
                new ByteArraySchema(),
                properties
        );
~~~



