# [Java]三种策略模式应用于服务的启动

## 背景

我们编写的大数据java代码被编译构建成jar之后，需要丢到服务器集群上去部署运行，而一个jar中往往包含很多个处理业务的应用，在我们部署jar运行的时候就需要去指定一个参数(任务名)去运行我们指定的业务逻辑。

比如一个jar中包含：

1、将Hive数据同步至MySQL的应用

2、Flink实时消费Kafka数据Sink到下游的应用

我们不希望jar运行的时候将两者同时运行，所以针对每个应用指定一个名字，在提交jar运行的时候指定我们的任务名字去运行指定的应用。OK，废话不多说。

那么，<u>有没有一种简单的方法去实现这样的一个功能呢？</u>

下面讨论三种方法去实现该功能。

## 开整

首先我们可以使用`commons-cli`包去解析我们的命令行参数

~~~java
public class ParameterOptions {

    /**
     * 开始时间，默认昨天，左闭
     */
    @Builder.Default
    private String startTime = DateUtil.millis2String(DateUtil.getLastOrNextNDay(System.currentTimeMillis(), -1), "yyyy-MM-dd");

    /**
     * 结束时间，默认今天，右开
     */
    @Builder.Default
    private String endTime = DateUtil.millis2String(System.currentTimeMillis(), "yyyy-MM-dd");

    /**
     * 任务名(要运行的唯一任务名)
     */
    private String jobName;
}


private static void commandCli(String[] args) throws ParseException {
    Options options = new Options();
    options.addOption("st", "startTime", true, "开始时间");
    options.addOption("et", "endTime", true, "结束时间");
    options.addOption("jn", "jobName", true, "任务名称");
    CommandLine cmd = new DefaultParser().parse(options, args);
    if (cmd.hasOption("st")) {
        parameterOptions.setStartTime(cmd.getOptionValue("st"));
    }
    if (cmd.hasOption("et")) {
        parameterOptions.setEndTime(cmd.getOptionValue("et"));
    }
    if (cmd.hasOption("jn")) {
        parameterOptions.setJobName(cmd.getOptionValue("jn"));
    }
}
~~~

上述代码解析命令行参数并封装成一个`ParameterOptions`类中，方便后续直接使用。

### 一 Switch简单粗暴

> 这其实不是策略模式，哈哈哈

如果我们想运行指定的任务，即可以使用上面的启动参数类去获得任务名，去调用指定的业务类去运行处理逻辑，比如下面这样：

~~~java
public static void main(String[] args) {
    String jobName = "";
    switch (jobName) {
        case "flink":
            new FlinkStreamJob().start();
        case "hive":
            new Hive2MySQLJob().start();
        default:
            new Exception("没有获得可以执行的任务");
    }
}
~~~

这样写确实可以实现我们的需求，但是这样不具有拓展性，如果新加了任务，那么就得去手动更改该部分的代码，那么有没有办法去让该部分代码固定化，我们每次去新家一个业务处理逻辑，都不用去管该部分代码。



### 二 Springboot自动注入

如果我们的代码是利用Springboot写的，那么就可以利用Springboot的注入特性，将**我们的业务处理逻辑注入到一个Map中**，键为任务的名字，值为业务处理的逻辑代码(这么说不准确)，更准确地说应该是是**接口的实现类**。

让我们来看一些代码。

首先我们定一个名为`BaseService`的接口，让我们的负责实际业务处理逻辑的类去实现该接口。

~~~java
public interface BaseService<T> {

    /**
     * 启动service处理
     */
    public void serviceStart(T t);

}
~~~

我们再定义一个名为`StreamService`的类去实现该接口

~~~java
@Component("stream")
public class StreamService implements Serializable, BaseService<ParameterOptions> {
    private final Logger LOG = LoggerFactory.getLogger(StreamService.class);
    @SneakyThrows
    public void launchJob(ParameterOptions parameterOptions) {
        //Some thing we do here.
    }

    @Override
    public void serviceStart(ParameterOptions parameterOptions) {
        launchJob(parameterOptions);
    }
}
~~~

​	注意我们使用`@Component`注解，并且指定参数为`stream`

我们再去Springboot的启动程序中

~~~java
@SpringBootApplication
public class Application implements CommandLineRunner {
    @Autowired
    private Map<String, BaseService<ParameterOptions>> serviceMap;

    public static void main(String[] args) throws ParseException {
        SpringApplication.run(Application.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        //解析命令行参数
        ParameterOptions parameterOptions = commandCli(args);
        String jobName = parameterOptions.getJobName();
        serviceMap.get(jobName).serviceStart(parameterOptions);
    }

    //省去解析命令行参数的代码
}
~~~

我们使用Springboot自动将实现了BaseService的实现类自动注入到一个Map中，就可以使用`@Commponent`的参数作为键，这样再通过从命令行拿到的任务名去map中匹配键拿到实际运行的实现类。

### 三 Java版的自动注入

以下方法实际上是上面方法的翻译版本，当我们不使用springboot框架去实现我们的逻辑时，可以使用这种方法,参考[这篇文章](https://blog.csdn.net/the_pure/article/details/124049396)

首先定义一个注解，用来实现将实现类注入到一个Map中，得到键的名字

~~~java
/**
 * 标记类需要put到策略map中
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface InjectToMap {
    // 策略模式名称
    String value() default "";
}
~~~

再定义我们的接口

~~~java
public interface IJobService {
    void jobExecute();
}
~~~

定义两个接口的实现类

~~~java
@InjectToMap("flink")
public class FlinkStreamJob implements IJobService {
    @Override
    public void jobExecute() {
        System.out.println("Flink Stream job start here ...");
    }
}

@InjectToMap("hive")
public class Hive2MySQLJob implements IJobService {
    @Override
    public void jobExecute() {
        System.out.println("Hive to MySQL job start here ...");
    }
}
~~~

定义一个处理策略的上下文

~~~java
package me.roohom.pattern;

import me.roohom.annotation.InjectToMap;
import org.reflections.Reflections;

import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class StrategyContext {
    // 策略Map
    public static final ConcurrentHashMap<String, IJobService> strategyMap = new ConcurrentHashMap<>();

    public void start(String jobName){
        IJobService jobService = strategyMap.get(jobName);
        jobService.jobExecute();
    }

    /**
     * 初始化map
     */
    public void initStrategyMap() {
        Reflections reflections = new Reflections(this.getClass().getPackage());
        // 获取所有包含PutInMap注解的类
        Set<Class<?>> annotationClasses = reflections.getTypesAnnotatedWith(InjectToMap.class);
        for (Class<?> classObject : annotationClasses) {
            InjectToMap annotation = classObject.getAnnotation(InjectToMap.class);
            IJobService instance = null;
            try {
                instance = (IJobService) classObject.newInstance();
            } catch (Exception e) {
                e.printStackTrace();
            }
            strategyMap.put(annotation.value(), instance);
            System.out.println("策略Map加入元素" + annotation.value() + "....");
        }
        System.out.println("策略Map初始化完成");
    }

    /**
     * 清理map
     */
    public void clearMap() {
        strategyMap.clear();
    }

}
~~~



OK，下面测试一下

~~~java
public static void main(String[] args) {
    StrategyContext strategy = new StrategyContext();
    strategy.initStrategyMap();
    strategy.start("flink");
}
~~~

结果

~~~java
策略Map加入元素flink....
策略Map加入元素hive....
策略Map初始化完成
Flink Stream job start here ...

Process finished with exit code 0
~~~

