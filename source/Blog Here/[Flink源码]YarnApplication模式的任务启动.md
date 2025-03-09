# [Flink源码]YarnApplication模式的任务启动

## 前瞻

上一回从源码层面简单分析了一个Flink任务是如何解析命令行参数，从而以ACTION RUN形式启动一个flink任务的。从flink run脚本接收到参数后，初始化一系列参数，调用`parseAndRun(String[] args)`方法，通过解析命令行传入的ACTION参数，以此来运行不同的模式(session模式、application模式)，下文将会接着从源码层面尝试分析一个applicantion模式的应用是如何启动的。

> 下文引用的Flink源码基于Flink 1.17版本



## parseAndRun

我们通常通过以下方式启动提交一个flink on yarn application的任务

~~~shell
./bin/flink run-application -t yarn-application ./examples/streaming/TopSpeedWindowing.jar
~~~

对应源码在`org.apache.flink.client.cli.CliFrontend#parseAndRun`

~~~java
public int parseAndRun(String[] args) {

    // check for action
    if (args.length < 1) {
        CliFrontendParser.printHelp(customCommandLines);
        System.out.println("Please specify an action.");
        return 1;
    }

    // get action
    String action = args[0];

    // remove action from parameters
    final String[] params = Arrays.copyOfRange(args, 1, args.length);

    try {
        // do action
        switch (action) {
            case ACTION_RUN:
                run(params);
                return 0;
            case ACTION_RUN_APPLICATION:
                runApplication(params);
                return 0;
            case ACTION_LIST:
                list(params);
                return 0;
            case ACTION_INFO:
                info(params);
                return 0;
            case ACTION_CANCEL:
                cancel(params);
                return 0;
            case ACTION_STOP:
                stop(params);
                return 0;
            case ACTION_SAVEPOINT:
                savepoint(params);
                return 0;
            case "-h":
            case "--help":
                CliFrontendParser.printHelp(customCommandLines);
                return 0;
            case "-v":
            case "--version":
                ...
                return 1;
        }
    } catch (Exeception ce) {
        ......
    }
}
~~~

直接进入runApplication(String[] args)，老样子，前面是一系列的参数校验和初始化，核心代码是：

~~~java
......
final ApplicationDeployer deployer =
                new ApplicationClusterDeployer(clusterClientServiceLoader);
......
deployer.run(effectiveConfiguration, applicationConfiguration);
~~~

那么我们看下`deployer.run`在被调用的时候都干了什么，戳进run进去可以看到调用的是接口ApplicationDeployer的run方法，使用ctrl+H找到该接口的实现类，发现只有一个`org.apache.flink.client.deployment.application.cli.ApplicationClusterDeployer`,那么它的run方法如下：

![org.apache.flink.client.deployment.application.cli.ApplicationClusterDeployer](flink-yarn-application-mode-startup/ApplicationClusterDeployer.jpg)



在run方法里，使用了clientServiceLoader进行类加载，当看到ServiceLoader的时候，DNA动了，这是JAVA的SPI机制，OK，那么我们看下这个clientServiceLoader是如何初始化的，就是要找到，它在什么时候创建并且被传入的。

我们找到clusterClientServiceLoader被初始化的地方，返回到CliFrontend，

![ClusterClientServiceLoader](flink-yarn-application-mode-startup/ClusterClientServiceLoader1.jpg)

可以看到是在CliFrontend被构造的时候传入的，那么就找到它的构造方法：

~~~java
public CliFrontend(Configuration configuration, List<CustomCommandLine> customCommandLines) {
    this(configuration, new DefaultClusterClientServiceLoader(), customCommandLines);
}
~~~

其实就在上图中，可以看到传入的是`org.apache.flink.client.deployment.DefaultClusterClientServiceLoader,` 那么，当`clientServiceLoader.getClusterClientFactory(configuration)`在执行时，其实调用的是`org.apache.flink.client.deployment.DefaultClusterClientServiceLoader#getClusterClientFactory`方法。

![DefaultClusterClientServiceLoader](flink-yarn-application-mode-startup/DefaultClusterClientServiceLoader.jpg)

可以看到，它千辛万苦寻找的其实就是`org.apache.flink.client.deployment.ClusterClientFactory`的实现类，打开它的实现类可以发现一共有好几个

~~~java
org.apache.flink.kubernetes.KubernetesClusterClientFactory
org.apache.flink.yarn.YarnClusterClientFactory
org.apache.flink.client.deployment.StandaloneClientFactory
~~~

用脚指头想都知道肯定是`org.apache.flink.yarn.YarnClusterClientFactory`,为什么呢？

因为他们的实现类都需要实现isCompatibleWith方法，只有YarnClusterClientFactory的方法里这个方法返回true，它解析的其实就是命令行传入的`-t`参数，当时我们传入的是`yarn-application`

~~~shell
./bin/flink run-application -t yarn-application ./examples/streaming/TopSpeedWindowing.jar
~~~

这个时候我们需要再回到`org.apache.flink.client.deployment.application.cli.ApplicationClusterDeployer`里，千万不要忘了来时的路，虽然很容易迷路。



同样的思路，我们很快能够定位到clusterDescriptor其实是`org.apache.flink.yarn.YarnClusterDescriptor`, 那么

```java
clusterDescriptor.deployApplicationCluster(
        clusterSpecification, applicationConfiguration)
```

执行的其实就是`org.apache.flink.yarn.YarnClusterDescriptor#deployApplicationCluster`



## deployApplicationCluster

同样的，进入这个方法可以看到前面很多参数的校验以及初始化，忽略这些，我们直接进入关键代码

![deployApplicationCluster](flink-yarn-application-mode-startup/deployApplicationCluster.jpg)

方法有详细的说明

> ```
>  This method will block until the ApplicationMaster/JobManager have been deployed on YARN.
> 
>  @param clusterSpecification Initial cluster specification for the Flink cluster to be deployed
>  @param applicationName name of the Yarn application to start
>  @param yarnClusterEntrypoint Class name of the Yarn cluster entry point.
>  @param jobGraph A job graph which is deployed with the Flink cluster, {@code null} if none
>  @param detached True if the cluster should be started in detached mode
> ```

注意到这个"Flink Application Cluster"没，当我们的任务不指定job name的时候，打开web ui的时候看到的默认就是它，除此之外，最核心的一个参数其实是(String yarnClusterEntrypoint), 这里传入的是`YarnApplicationClusterEntryPoint.class.getName()`, 其实这个deployInternal里面干的事儿就是启动ApplicationMaster/JobManager，当AM启动之后需要执行的入口类就是YarnApplicationClusterEntryPoint，不放进入YarnApplicationClusterEntryPoint里看看都有些什么：

![YarnApplicationClusterEntryPoint](flink-yarn-application-mode-startup/YarnApplicationClusterEntryPoint.jpg)



太好了！是main()方法，我们有救了！

同样地，配置参数配置及初始化我们都暂时忽略，直戳要害看重点，在main方法的最后：

```java
YarnApplicationClusterEntryPoint yarnApplicationClusterEntrypoint =
        new YarnApplicationClusterEntryPoint(configuration, program);

ClusterEntrypoint.runClusterEntrypoint(yarnApplicationClusterEntrypoint);
```

new了一下自己，并调用`ClusterEntrypoint.runClusterEntrypoint`，进入这个方法：

~~~java
public static void runClusterEntrypoint(ClusterEntrypoint clusterEntrypoint) {

    final String clusterEntrypointName = clusterEntrypoint.getClass().getSimpleName();
    try {
        clusterEntrypoint.startCluster();
    } catch (ClusterEntrypointException e) {
        LOG.error(
            String.format("Could not start cluster entrypoint %s.", clusterEntrypointName),
            e);
        System.exit(STARTUP_FAILURE_RETURN_CODE);
    }

    int returnCode;
    Throwable throwable = null;

    try {
        returnCode = clusterEntrypoint.getTerminationFuture().get().processExitCode();
    } catch (Throwable e) {
        throwable = ExceptionUtils.stripExecutionException(e);
        returnCode = RUNTIME_FAILURE_RETURN_CODE;
    }

    LOG.info(
        "Terminating cluster entrypoint process {} with exit code {}.",
        clusterEntrypointName,
        returnCode,
        throwable);
    System.exit(returnCode);
}
~~~

核心方法是：`clusterEntrypoint.startCluster(); `, 直接进入，我已经迫不及待看见它开始的地方了

![startCluster](flink-yarn-application-mode-startup/startCluster.jpg)



同样地，进入runCluster这个方法，接下来，就是有点迷惑人的地方了，迷宫开始了。



## runCluster

runCluster没有返回值，所以该做的事情，在这个方法里就做完了，所以究竟做了哪些事情呢？

![clusterComponent](flink-yarn-application-mode-startup/runCluster.jpg)

通过工厂类的命名可以猜到，需要创建dispatcher和resourceManager这两个组件，其实这两个组件也就是JobManager的核心组件，进入到这个工厂中，详细看看是如何创建的

### DispatcherResourceManagerComponent

同样，戳进create方法，进入的是`org.apache.flink.runtime.entrypoint.component.DispatcherResourceManagerComponentFactory`这个工厂接口

它只有一个实现类就是`org.apache.flink.runtime.entrypoint.component.DefaultDispatcherResourceManagerComponentFactory`, 所以就看它的create方法即可

这个方法的方法体很长，同样，非核心的代码去掉暂时不看

什么？你哪知道哪些核心不核心？

这不好说呀，只能根据经验和方法命名来猜，如果你没猜错的话一定是猜对了。

~~~java
@Override
public DispatcherResourceManagerComponent create(
    Configuration configuration,
    ResourceID resourceId,
    Executor ioExecutor,
    RpcService rpcService,
    HighAvailabilityServices highAvailabilityServices,
    BlobServer blobServer,
    HeartbeatServices heartbeatServices,
    DelegationTokenManager delegationTokenManager,
    MetricRegistry metricRegistry,
    ExecutionGraphInfoStore executionGraphInfoStore,
    MetricQueryServiceRetriever metricQueryServiceRetriever,
    FatalErrorHandler fatalErrorHandler)
    throws Exception {

    LeaderRetrievalService dispatcherLeaderRetrievalService = null;
    LeaderRetrievalService resourceManagerRetrievalService = null;
    WebMonitorEndpoint<?> webMonitorEndpoint = null;
    ResourceManagerService resourceManagerService = null;
    DispatcherRunner dispatcherRunner = null;

    try {
        dispatcherLeaderRetrievalService =
            highAvailabilityServices.getDispatcherLeaderRetriever();

        resourceManagerRetrievalService =
            highAvailabilityServices.getResourceManagerLeaderRetriever();

        final LeaderGatewayRetriever<DispatcherGateway> dispatcherGatewayRetriever =
            new RpcGatewayRetriever<>(
            rpcService,
            DispatcherGateway.class,
            DispatcherId::fromUuid,
            new ExponentialBackoffRetryStrategy(
                12, Duration.ofMillis(10), Duration.ofMillis(50)));

        final LeaderGatewayRetriever<ResourceManagerGateway> resourceManagerGatewayRetriever =
            new RpcGatewayRetriever<>(
            rpcService,
            ResourceManagerGateway.class,
            ResourceManagerId::fromUuid,
            new ExponentialBackoffRetryStrategy(
                12, Duration.ofMillis(10), Duration.ofMillis(50)));

        final ScheduledExecutorService executor =
            WebMonitorEndpoint.createExecutorService(
            configuration.getInteger(RestOptions.SERVER_NUM_THREADS),
            configuration.getInteger(RestOptions.SERVER_THREAD_PRIORITY),
            "DispatcherRestEndpoint");

        final long updateInterval =
            configuration.getLong(MetricOptions.METRIC_FETCHER_UPDATE_INTERVAL);
        final MetricFetcher metricFetcher =
            updateInterval == 0
            ? VoidMetricFetcher.INSTANCE
            : MetricFetcherImpl.fromConfiguration(
                configuration,
                metricQueryServiceRetriever,
                dispatcherGatewayRetriever,
                executor);

        webMonitorEndpoint =
            restEndpointFactory.createRestEndpoint(
            configuration,
            dispatcherGatewayRetriever,
            resourceManagerGatewayRetriever,
            blobServer,
            executor,
            metricFetcher,
            highAvailabilityServices.getClusterRestEndpointLeaderElectionService(),
            fatalErrorHandler);

        log.debug("Starting Dispatcher REST endpoint.");
        webMonitorEndpoint.start();

        final String hostname = RpcUtils.getHostname(rpcService);

        resourceManagerService =
            ResourceManagerServiceImpl.create(
            resourceManagerFactory,
            configuration,
            resourceId,
            rpcService,
            highAvailabilityServices,
            heartbeatServices,
            delegationTokenManager,
            fatalErrorHandler,
            new ClusterInformation(hostname, blobServer.getPort()),
            webMonitorEndpoint.getRestBaseUrl(),
            metricRegistry,
            hostname,
            ioExecutor);

        final HistoryServerArchivist historyServerArchivist =
            HistoryServerArchivist.createHistoryServerArchivist(
            configuration, webMonitorEndpoint, ioExecutor);

        final DispatcherOperationCaches dispatcherOperationCaches =
            new DispatcherOperationCaches(
            configuration.get(RestOptions.ASYNC_OPERATION_STORE_DURATION));

        final PartialDispatcherServices partialDispatcherServices =
            new PartialDispatcherServices(
            configuration,
            highAvailabilityServices,
            resourceManagerGatewayRetriever,
            blobServer,
            heartbeatServices,
            () ->
            JobManagerMetricGroup.createJobManagerMetricGroup(
                metricRegistry, hostname),
            executionGraphInfoStore,
            fatalErrorHandler,
            historyServerArchivist,
            metricRegistry.getMetricQueryServiceGatewayRpcAddress(),
            ioExecutor,
            dispatcherOperationCaches);

        log.debug("Starting Dispatcher.");
        dispatcherRunner =
            dispatcherRunnerFactory.createDispatcherRunner(
            highAvailabilityServices.getDispatcherLeaderElectionService(),
            fatalErrorHandler,
            new HaServicesJobPersistenceComponentFactory(highAvailabilityServices),
            ioExecutor,
            rpcService,
            partialDispatcherServices);

        log.debug("Starting ResourceManagerService.");
        resourceManagerService.start();

        resourceManagerRetrievalService.start(resourceManagerGatewayRetriever);
        dispatcherLeaderRetrievalService.start(dispatcherGatewayRetriever);

        return new DispatcherResourceManagerComponent(
            dispatcherRunner,
            resourceManagerService,
            dispatcherLeaderRetrievalService,
            resourceManagerRetrievalService,
            webMonitorEndpoint,
            fatalErrorHandler,
            dispatcherOperationCaches);

    } catch (Exception exception) {
        // clean up all started components
        if (dispatcherLeaderRetrievalService != null) {
            try {
                dispatcherLeaderRetrievalService.stop();
            } catch (Exception e) {
                exception = ExceptionUtils.firstOrSuppressed(e, exception);
            }
        }

        if (resourceManagerRetrievalService != null) {
            try {
                resourceManagerRetrievalService.stop();
            } catch (Exception e) {
                exception = ExceptionUtils.firstOrSuppressed(e, exception);
            }
        }

        final Collection<CompletableFuture<Void>> terminationFutures = new ArrayList<>(3);

        ......
    }
~~~

从上往下看，可以知道，在一系列组件被创建之后就一并执行了，这里创建了webMonitorEndpoint、resourceManagerService、resourceManagerRetrievalService、dispatcherLeaderRetrievalService，并且返回了一个DispatcherResourceManagerComponent



### resourceManagerService

来看看resourceManagerService是如何创建的，它的创建通过调用ResourceManagerServiceImpl的create方法进行创建，

~~~java
resourceManagerService =
        ResourceManagerServiceImpl.create(
                resourceManagerFactory,
                configuration,
                resourceId,
                rpcService,
                highAvailabilityServices,
                heartbeatServices,
                delegationTokenManager,
                fatalErrorHandler,
                new ClusterInformation(hostname, blobServer.getPort()),
                webMonitorEndpoint.getRestBaseUrl(),
                metricRegistry,
                hostname,
                ioExecutor);
~~~

戳进去，会发现就是它自己，之后调用了start()方法进行启动



TODO: 后续dispatcherRunner的启动