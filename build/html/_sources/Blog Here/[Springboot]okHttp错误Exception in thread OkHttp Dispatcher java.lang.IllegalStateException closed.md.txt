# [Springboot]okHttp错误:*Exception* in thread "OkHttp Dispatcher" *java.lang.IllegalStateException*: closed

在做一个接口任务时，使用okHttp时报了以下这样的错误:

~~~java
2021-10-13 05:33:02.167  INFO 1 --- [xxx.com/...] c.s.d.webhook.controller.CoreController  : {"code":"000000","description":"Success","data":"success"}
2021-10-13 05:33:02.167  INFO 1 --- [xxx.com/...] c.s.d.webhook.controller.CoreController  : 
Exception in thread "OkHttp Dispatcher" java.lang.IllegalStateException: closed
	at okhttp3.internal.http.Http1xStream$ChunkedSource.read(Http1xStream.java:418)
	at okio.Buffer.writeAll(Buffer.java:993)
	at okio.RealBufferedSource.readByteArray(RealBufferedSource.java:106)
	at okhttp3.ResponseBody.bytes(ResponseBody.java:128)
	at okhttp3.ResponseBody.string(ResponseBody.java:154)
	at com.svw.data.webhook.controller.CoreController$1.onResponse(CoreController.java:104)
	at okhttp3.RealCall$AsyncCall.execute(RealCall.java:133)
	at okhttp3.internal.NamedRunnable.run(NamedRunnable.java:32)
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
	at java.lang.Thread.run(Thread.java:748)
~~~

可以看到接口请求已经成功了，可是还是报了以上的错误。

搜索发现这个错误居然是由于`response.body().string()`调用了多次导致的，`string()`仅可调用一次。

在代码中将该调用修改为仅一次调用即可，此错误就消失了。