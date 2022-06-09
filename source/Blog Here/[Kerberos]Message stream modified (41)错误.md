# [Kerberos]Message stream modified (41)错误

Springboot应用程序登录Kerberos报错：

~~~java
java.io.IOException: Login failure for xxx@XXXX.COM from keytab /app/keytabs/prod/xxx.keytab: javax.security.auth.login.LoginException: Message stream modified (41)
	at org.apache.hadoop.security.UserGroupInformation.loginUserFromKeytab(UserGroupInformation.java:979)
	at com.svw.data.webhook.util.ImpalaConnection.executeSql(ImpalaConnection.java:41)
	at com.svw.data.webhook.controller.CoreController.taskCommit(CoreController.java:69)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at 
......
Caused by: KrbException: Message stream modified (41)
	at sun.security.krb5.KrbKdcRep.check(KrbKdcRep.java:103)
	at sun.security.krb5.KrbAsRep.decrypt(KrbAsRep.java:159)
	at sun.security.krb5.KrbAsRep.decryptUsingKeyTab(KrbAsRep.java:121)
	at sun.security.krb5.KrbAsReqBuilder.resolve(KrbAsReqBuilder.java:310)
	at sun.security.krb5.KrbAsReqBuilder.action(KrbAsReqBuilder.java:498)
	at com.sun.security.auth.module.Krb5LoginModule.attemptAuthentication(Krb5LoginModule.java:780)
	... 78 more
~~~

解决：

删除 krb5.conf 配置文件里的 `renew_lifetime = xxx` 这行配置即可

