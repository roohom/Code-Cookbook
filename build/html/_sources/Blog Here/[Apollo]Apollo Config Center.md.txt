# [Apollo]Apollo Config Center

> Apollo（阿波罗）是一款可靠的分布式配置管理中心，诞生于携程框架研发部，能够集中化管理应用不同环境、不同集群的配置，配置修改后能够实时推送到应用端，并且具备规范的权限、流程治理等特性，适用于微服务配置管理场景。

下面就如何使用Apollo配置中心进行步骤演练，分Springboot应用程序场景和普通Java应用程序场景进行说明。

## Java单体应用

### 定义AppId

接入Apollo的应用程序需要一个唯一的AppId，给应用程序定义AppId的办法有几种,以下摘取两种：

1、System Property

~~~ini
-Dapp.id=YOUR-APP-ID
~~~

2、app.properties

确保classpath:/META-INF/app.properties文件存在，并且其中内容形如：

~~~ini
app.id=YOUR-APP-ID
~~~

### 配置Apollo Meta Server

>  Apollo支持应用在不同的环境有不同的配置，所以需要在运行提供给Apollo客户端当前环境的[Apollo Meta Server](https://www.apolloconfig.com/#/zh/design/apollo-design?id=_133-meta-server)信息。默认情况下，meta server和config service是部署在同一个JVM进程，所以meta server的地址就是config service的地址。

Meta Server的地址端口默认为8080，可以使用Ip也可以使用域名指定其地址。

指定其地址有以下几种方式：

- 可以通过Java的System Property `apollo.meta`来指定

  ~~~ini
  -Dapollo.meta=http://config-service-url
  ~~~

- 在运行jar时指定

  ~~~ini
  -Dapollo.meta=http://config-service-url
  ~~~

- 也可以通过程序指定，如

  ~~~ini
  System.setProperty("apollo.meta", "http://config-service-url");
  ~~~

### 本地缓存

Apollo客户端会把从服务端获取到的配置在本地文件系统缓存一份，用于在遇到服务不可用，或网络不通的时候，依然能从本地恢复配置，不影响应用正常运行。

本地缓存路径默认位于以下路径，所以请确保`/opt/data`目录存在，且应用有读写权限。

默认地址为：

~~~ini
/opt/data/{appId}/config-cache
~~~

当然，该地址也可以自己指定

在jar包启动之前通过启动脚本指定该位置：

~~~ini
-Dapollo.cache-dir=/opt/data/some-cache-dir
~~~

### 本地开发

1、引入maven坐标

~~~xml
<dependency>
    <groupId>com.ctrip.framework.apollo</groupId>
    <artifactId>apollo-client</artifactId>
    <version>1.7.0</version>
</dependency>
~~~

2、在项目的resources目录下创建`META-INF`文件夹，并在文件夹下放入名为`app.properties`文件，内容指定Appid

~~~ini
app.id=SampleApp
~~~

> 如果通过别的方式指定该ID，则忽略此种方式

3、获取默认namespace的配置

此种方式，每次调用时都会从配置中心取到最新的值。

~~~java
Config config = ConfigService.getAppConfig(); 
String someKey = "default";
String someDefaultValue = "defaultValue";
String value = config.getProperty(someKey, someDefaultValue);
~~~

4、获取指定namespace下的配置

实际应用时，有不同的namespace，根据应用的不同从指定的namespace下去获取组新的配置，此种方式每次获取都是最新的配置

~~~java
String somePublicNamespace = "aNamespace";
Config config = ConfigService.getConfig(somePublicNamespace); 
String someKey = "targetKey";
String someDefaultValue = "targetValue";
String value = config.getProperty(someKey, someDefaultValue);
~~~

5、如果想要实时获取配置的更新通知，可以使用如下：

比如MySQL的连接信息变更了，需要实时同步建立新的连接

~~~java
Config config = ConfigService.getAppConfig(); 
config.addChangeListener(new ConfigChangeListener() {
    @Override
    public void onChange(ConfigChangeEvent changeEvent) {
        System.out.println("Changes for namespace " + changeEvent.getNamespace());
        for (String key : changeEvent.changedKeys()) {
            ConfigChange change = changeEvent.getChange(key);
            System.out.println(String.format("Found change - key: %s, oldValue: %s, newValue: %s, changeType: %s", change.getPropertyName(), change.getOldValue(), change.getNewValue(), change.getChangeType()));
        }
    }
});
~~~



## Springboot应用场景

