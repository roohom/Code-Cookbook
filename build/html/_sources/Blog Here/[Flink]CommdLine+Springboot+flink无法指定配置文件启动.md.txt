# [Flink]CommdLine+Springboot+flink无法指定配置文件启动

## 背景

由于项目是使用Springboot+Flink写的，用Springboot作代码框架，使用其灵活的注入特性，数据的计算使用Flink，由于项目需要支持解析不同的参数，所以使用了CommandLine包去解析命令行参数，这样写起来确实很好，但是在任务提交到集群的时候出现了一个问题。纯生Springboot应用程序的配置文件可以由`--spring.profiles.active=xxx`去随意切换，可是，这在本项目中行不通了，直接在命令行提交时(在jar后面指定该参数)不仅无法识别行会报错。

## 解决办法

Flink应用程序在启动时可以指定JVM参数，让程序在加载的时候应用指定的参数，所以让JVM去加载，我们的Springboot应用程序就可以启动并接收到参数了。以下实测可以执行：

~~~shell
./bin/flink run-application \
-t yarn-application \
-D jobmanager.memory.process.size=2g \
-D taskmanager.memory.process.size=2g \
-D yarn.application.name=xxxx \
-D env.java.opts="-Dspring.profiles.active=test" \
/path/to/your/xxx.jar -jn a_job_name
~~~

jar后面的`-jn`为使用CommandLine自定义的命令行参数，核心在于`-D env.java.opts="-Dspring.profiles.active=test"`



> 说明：以上使用Flink的Application mode运行模式可以成功提交并切换配置文件，可是使用Yarn session模式和yarn-per-job模式却不行。探索中...

### 补充

当使用yarn-session模式或者yarn-per-job模式提交任务时，使用

~~~shell
export FLINK_ENV_JAVA_OPTS="-Dspring.profiles.active=test"
~~~

可以达成想要的效果，但是`-D env.java.opts="-Dspring.profiles.active=test" `却不可以，测试的Flink版本为1.12