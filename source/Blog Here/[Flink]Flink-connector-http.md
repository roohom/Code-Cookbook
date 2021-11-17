# [Flink]Flink-connector-http

> 下面展示如何通过Flink去请求http接口或者将数据发送给http接口

## Source

准备工作，需要在maven中引入依赖：

~~~xml
<dependency>
    <groupId>org.apache.httpcomponents</groupId>
    <artifactId>httpclient</artifactId>
    <version>4.5.10</version>
</dependency>
~~~

一个HttpUtil，往上很多工具，用来实际发送http请求，详见附录部分

### Get

~~~java
public class HttpGetSource extends RichSourceFunction<String> {

    private volatile boolean isRunning = true;
    private String url;
    private long requestInterval;
    private DeserializationSchema<String> deserializer;
    // count out event
    private transient Counter counter;

    public HttpGetSource(String url, long requestInterval, DeserializationSchema<String> deserializer) {
        this.url = url;
        this.requestInterval = requestInterval;
        this.deserializer = deserializer;
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        counter = new SimpleCounter();
        this.counter = getRuntimeContext()
                .getMetricGroup()
                .counter("myCounter");
    }

    @Override
    public void run(SourceContext<String> ctx) throws Exception {
        while (isRunning) {
            try {
                // receive http message, csv format
                String message = HttpUtil.doGet(url);
                // deserializer csv message
                ctx.collect(deserializer.deserialize(message.getBytes()).toString());
                this.counter.inc();

                Thread.sleep(requestInterval);
            } catch (Exception e) {
                e.printStackTrace();
            }

        }
    }
    @Override
    public void cancel() {
        isRunning = false;
    }

}

~~~

### Post

~~~java
public class HttpPostSource extends RichSourceFunction<String> {

    private volatile boolean isRunning = true;
    private String url;
    private long requestInterval;
    private DeserializationSchema<String> deserializer;
    // count out event
    private transient Counter counter;
    private String body;

    public HttpPostSource(String url, long requestInterval, String body, DeserializationSchema<String> deserializer) {
        this.url = url;
        this.requestInterval = requestInterval;
        this.deserializer = deserializer;
        this.body = body;
    }

    @Override
    public void open(Configuration parameters) throws Exception {
        counter = new SimpleCounter();
        this.counter = getRuntimeContext()
                .getMetricGroup()
                .counter("myCounter");
    }

    @Override
    public void run(SourceContext<String> ctx) throws Exception {
        while (isRunning) {
            try {
                // receive http message, csv format
                String message = HttpUtil.doPost(url, body, 1000);
                // deserializer csv message
                ctx.collect(deserializer.deserialize(message.getBytes()).toString());
                this.counter.inc();

                Thread.sleep(requestInterval);
            } catch (Exception e) {
                e.printStackTrace();
            }

        }
    }
    @Override
    public void cancel() {
        isRunning = false;
    }
}
~~~

### 使用

- 使用Post

  ~~~java
  DataStreamSource<String> streamSource = env.addSource(new HttpPostSource(URL, 1000, "", new SimpleStringSchema()));
  ~~~

- 使用Get

  ~~~java
  DataStreamSource<String> streamSource = env.addSource(new HttpGetSource(URL, 1000, new SimpleStringSchema()));
  ~~~

  

## Sink

同样可以将数据使用http发送出去，sink到其他端

这里使用别人已经写好的工具，需要在maven中引入

~~~xml
<!--flink-connector-http-->
<dependency>
    <groupId>net.galgus</groupId>
    <artifactId>flink-connector-http</artifactId>
    <version>1.0-SNAPSHOT</version>
</dependency>
~~~



先定义配置条件

~~~java
//设置endpoint
String endpoint = "http://localhost:8080/api/postdata/";
//设置header
HashMap<String, String> headerMap = new HashMap<>();
headerMap.put("Content-Type", "application/json");
HTTPConnectionConfig httpConnectionConfig = new HTTPConnectionConfig(
        endpoint,
        HTTPConnectionConfig.HTTPMethod.POST,
        headerMap,
        false
);
~~~

在数据流中添加sink即可：

~~~java
stream.addSink(new HTTPSink<>(httpConnectionConfig))
~~~



## 附录

- HttpUtil

~~~java
public class HttpUtil {
    private static final Logger log = LoggerFactory.getLogger(HttpUtil.class);

    /**
     * 默认超时时间
     */
    private static final int DEFAULT_TIME_OUT = 3000;
    /**
     * get请求，超时时间默认
     * @param api 请求URL
     * @return 响应JSON字符串
     */
    public static String doGet(String api) {
        return doGet(api, DEFAULT_TIME_OUT);
    }

    /**
     * get请求，超时时间传参
     * @param api 请求URL
     * @param timeOut 请求超时时间（毫秒）
     * @return 响应JSON字符串
     */
    public static String doGet(String api, int timeOut) {
        HttpGet httpGet = new HttpGet(api);
        RequestConfig config = RequestConfig.custom()
                .setConnectTimeout(timeOut)
                .setConnectionRequestTimeout(timeOut)
                .build();
        httpGet.setConfig(config);

        try (CloseableHttpClient client = HttpClients.createDefault();
             CloseableHttpResponse response = client.execute(httpGet)) {
            return EntityUtils.toString(response.getEntity());
        } catch (IOException e) {
            log.error("get " + api + " failed!", e);
        }
        return null;
    }

    /**
     * post请求，超时时间默认
     * @param api 请求URL
     * @param body 请求体JSON字符串
     * @return 响应JSON字符串
     */
    public static String doPost(String api, String body) {
        return doPost(api, body, DEFAULT_TIME_OUT);
    }

    /**
     * post请求，超时时间传参
     * @param api 请求URL
     * @param body 请求体JSON字符串
     * @param timeOut 请求超时时间（毫秒）
     * @return 响应JSON字符串
     */
    public static String doPost(String api, String body, int timeOut) {
        HttpPost httpPost = new HttpPost(api);
        StringEntity entity = new StringEntity(body, "utf-8");
        entity.setContentType("application/json");
        entity.setContentEncoding("utf-8");
        httpPost.setEntity(entity);
        RequestConfig config = RequestConfig.custom()
                .setConnectTimeout(timeOut)
                .setConnectionRequestTimeout(timeOut)
                .build();
        httpPost.setConfig(config);

        try (CloseableHttpClient client = HttpClients.createDefault();
             CloseableHttpResponse response = client.execute(httpPost)) {
            return EntityUtils.toString(response.getEntity());
        } catch (IOException e) {
            log.error("post " + api + " failed!", e);
        }
        return null;
    }
}
~~~

- 完整测试pom文件

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>me.roohom</groupId>
    <artifactId>flink-http</artifactId>
    <version>1.0</version>

    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <flink.version>1.12.2</flink.version>
        <kafka.version>2.1.0</kafka.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-clients_2.11</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-api-java-bridge_2.11</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-table-planner-blink_2.11</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-streaming-java_2.11</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>

        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-kafka_2.11</artifactId>
            <version>${flink.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-runtime-web_2.11</artifactId>
            <version>${flink.version}</version>
            <scope>compile</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.22</version>
        </dependency>

        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.7.4</version>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-simple</artifactId>
            <version>1.7.25</version>
        </dependency>
        <dependency>
            <groupId>org.apache.httpcomponents</groupId>
            <artifactId>httpclient</artifactId>
            <version>4.5.10</version>
        </dependency>

        <!--flink-connector-http-->
        <dependency>
            <groupId>net.galgus</groupId>
            <artifactId>flink-connector-http</artifactId>
            <version>1.0-SNAPSHOT</version>
        </dependency>

    </dependencies>

</project>
~~~

