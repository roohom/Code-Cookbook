# [Spark]Spark提交任务RSA premaster secret error

今天在使用spark-submit提交一个Springboot整合spark，并且支持读写kudu表的jar包到集群运行时，报了错，

在没有支持kudu之前，也就是没有引入spark-kudu的jar包依赖之前，程序完美运行，但是在引入之后报了如下的错误:

~~~java

javax.net.ssl.SSLKeyException: RSA premaster secret error
        at sun.security.ssl.RSAClientKeyExchange.<init>(RSAClientKeyExchange.java:87)
        at sun.security.ssl.ClientHandshaker.serverHelloDone(ClientHandshaker.java:912)
        at sun.security.ssl.ClientHandshaker.processMessage(ClientHandshaker.java:348)
        at sun.security.ssl.Handshaker.processLoop(Handshaker.java:1026)
        at sun.security.ssl.Handshaker.process_record(Handshaker.java:961)
        at sun.security.ssl.SSLSocketImpl.readRecord(SSLSocketImpl.java:1062)
        at sun.security.ssl.SSLSocketImpl.performInitialHandshake(SSLSocketImpl.java:1375)
        at sun.security.ssl.SSLSocketImpl.startHandshake(SSLSocketImpl.java:1403)
        at sun.security.ssl.SSLSocketImpl.startHandshake(SSLSocketImpl.java:1387)
        at org.apache.http.conn.ssl.SSLConnectionSocketFactory.createLayeredSocket(SSLConnectionSocketFactory.java:290)
        at org.apache.http.conn.ssl.SSLConnectionSocketFactory.connectSocket(SSLConnectionSocketFactory.java:259)
        at org.apache.http.impl.conn.HttpClientConnectionOperator.connect(HttpClientConnectionOperator.java:125)
        at org.apache.http.impl.conn.PoolingHttpClientConnectionManager.connect(PoolingHttpClientConnectionManager.java:319)
        at org.apache.http.impl.execchain.MainClientExec.establishRoute(MainClientExec.java:363)
        at org.apache.http.impl.execchain.MainClientExec.execute(MainClientExec.java:219)
        at org.apache.http.impl.execchain.ProtocolExec.execute(ProtocolExec.java:195)
        at org.apache.http.impl.execchain.RetryExec.execute(RetryExec.java:86)
        at org.apache.http.impl.execchain.RedirectExec.execute(RedirectExec.java:108)
        at org.apache.http.impl.client.InternalHttpClient.doExecute(InternalHttpClient.java:184)
        at org.apache.http.impl.client.CloseableHttpClient.execute(CloseableHttpClient.java:82)
        at org.apache.http.impl.client.CloseableHttpClient.execute(CloseableHttpClient.java:106)

        at java.lang.Thread.run(Thread.java:745)
Caused by: java.security.NoSuchAlgorithmException: SunTls12RsaPremasterSecret KeyGenerator not available
        at javax.crypto.KeyGenerator.<init>(KeyGenerator.java:169)
        at javax.crypto.KeyGenerator.getInstance(KeyGenerator.java:223)
        at sun.security.ssl.JsseJce.getKeyGenerator(JsseJce.java:251)
        at sun.security.ssl.RSAClientKeyExchange.<init>(RSAClientKeyExchange.java:78)
        ... 22 more

~~~

面向百度编程，你懂的，搜到的结果是说在类加载的时候没有加载到合适的jar包，具体指的是`sunjce_provider.jar`这个jar包，而这个jar包在Java的目录下即`$JAVA_HOME/jre/lib/ext`目录下，我觉得很奇怪，为什么引入spark整合kudu的jar就会有这样的问题？在整个项目不适用springboot而只是spark整合kudu的情况下又不没遇到过这样的问题？

我是怎么解决的呢？

既然它没有找到该jar，也就是在classpath上没有这个jar所在的目录，那么我手动指定一下告诉程序它在哪不就好了？我最终通过在spark-submit的命令上加伤这样一个参数解决了问题：

~~~
--driver.class.path "$JAVA_HOME/jre/lib/ext/*"
~~~

> 如果需要引入多个目录，那么目录之间应该使用`:`分割



至于为什么会出现这样的问题，还有待深入研究，博客中的一些developer说涉及到java的类加载机制，改天研究下。

